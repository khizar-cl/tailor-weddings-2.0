import { clerkClient } from "@clerk/express";
import { ORPCError } from "@orpc/server";
import {
	type ActiveMode,
	ActiveModeEnum,
	type Capabilities,
	Roles,
	type UserPreferences,
} from "@repo/shared";
import { desc, eq, or } from "drizzle-orm";
import { users, vendorAccounts, weddings } from "../../db";
import { db } from "../../db/db";
import { logger } from "../../utils/logger";
import { withRetry } from "../../utils/retry";

export async function getUserById(dbUserId: number) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, dbUserId),
		with: {
			createdByUser: { columns: { uuid: true } },
			updatedByUser: { columns: { uuid: true } },
		},
	});

	if (!user) {
		throw new ORPCError("NOT_FOUND", { message: "User not found" });
	}

	const { id: _, clerkId: __, createdByUser, updatedByUser, ...rest } = user;
	return {
		...rest,
		createdBy: createdByUser?.uuid ?? null,
		updatedBy: updatedByUser?.uuid ?? null,
	};
}

export async function getUserPreferences(dbUserId: number) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, dbUserId),
		columns: { preferences: true },
	});

	if (!user) {
		throw new ORPCError("NOT_FOUND", { message: "User not found" });
	}

	return user.preferences;
}

export async function updateUserPreferences(
	dbUserId: number,
	input: Record<string, unknown>,
) {
	const existing = await db.query.users.findFirst({
		where: eq(users.id, dbUserId),
		columns: { preferences: true },
	});

	if (!existing) {
		throw new ORPCError("NOT_FOUND", { message: "User not found" });
	}

	const merged = {
		...existing.preferences,
		...input,
	};

	const [updated] = await db
		.update(users)
		.set({
			preferences: merged,
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(eq(users.id, dbUserId))
		.returning();

	if (!updated) {
		throw new ORPCError("NOT_FOUND", { message: "User not found" });
	}

	return updated.preferences;
}

// Throws plain Error (not ORPCError) so non-oRPC callers can translate it.
export async function ensureUserExists(clerkId: string) {
	const existing = await db.query.users.findFirst({
		where: eq(users.clerkId, clerkId),
		columns: { id: true, uuid: true, role: true, deletedAt: true },
	});

	if (existing) {
		return existing;
	}

	// Only read from Clerk on first auth; the DB is source of truth afterward.
	let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>;
	try {
		clerkUser = await withRetry(() => clerkClient.users.getUser(clerkId), {
			onRetry: (err, attempt, delayMs) => {
				logger.warn(
					{ err, clerkId, attempt, delayMs },
					"Clerk getUser failed, retrying",
				);
			},
		});
	} catch (clerkError) {
		logger.error(
			{ err: clerkError, clerkId },
			"Clerk getUser failed during first-auth user provisioning",
		);
		throw new Error("Identity provider unavailable. Please try again.", {
			cause: clerkError,
		});
	}

	const metadata = clerkUser.unsafeMetadata as { intent?: string } | undefined;
	// The landing choice (couple vs vendor) is written to Clerk metadata at
	// sign-up. It seeds the active mode and the single capability we provision.
	// `intent` grants no privilege, so it's safe to read from client-writable
	// unsafeMetadata. `role` is deliberately NOT read here: unsafeMetadata is
	// client-controlled, so trusting it would let anyone self-assign admin.
	// New users are always members; admin is granted out-of-band.
	const intent = ActiveModeEnum.safeParse(metadata?.intent).data ?? "couple";

	const [inserted] = await db
		.insert(users)
		.values({
			clerkId,
			email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
			name:
				[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
				"",
			imageUrl: clerkUser.imageUrl,
			role: Roles.MEMBER,
			preferences: { activeMode: intent },
		})
		.onConflictDoNothing({ target: users.clerkId })
		.returning({
			id: users.id,
			uuid: users.uuid,
			role: users.role,
			deletedAt: users.deletedAt,
		});

	if (inserted) {
		// Provision exactly one backing row for the landing intent. Only the
		// insert winner reaches here; the conflict path re-reads a row that the
		// winner already provisioned, so there's no double-provision.
		await provisionCapability(inserted.id, intent);
		logger.info({ clerkId, intent }, "Created new user from Clerk data");
		return inserted;
	}

	const retry = await db.query.users.findFirst({
		where: eq(users.clerkId, clerkId),
		columns: { id: true, uuid: true, role: true, deletedAt: true },
	});
	if (!retry) {
		logger.error(
			{ clerkId },
			"User insert was a no-op but row could not be loaded",
		);
		throw new Error("Failed to create user account");
	}
	return retry;
}

export async function listUsers() {
	const allUsers = await db.query.users.findMany({
		columns: {
			uuid: true,
			email: true,
			name: true,
			role: true,
			imageUrl: true,
			createdAt: true,
		},
		orderBy: [desc(users.createdAt)],
	});

	return { users: allUsers };
}

/**
 * Capabilities are derived from row ownership, never stored: a user is a couple
 * when they own or partner a wedding, and a vendor when they own a vendor
 * account.
 */
export async function getCapabilities(dbUserId: number): Promise<Capabilities> {
	const [wedding, vendorAccount] = await Promise.all([
		db.query.weddings.findFirst({
			where: or(
				eq(weddings.ownerUserId, dbUserId),
				eq(weddings.partnerUserId, dbUserId),
			),
			columns: { id: true },
		}),
		db.query.vendorAccounts.findFirst({
			where: eq(vendorAccounts.userId, dbUserId),
			columns: { id: true },
		}),
	]);

	return { isCouple: Boolean(wedding), isVendor: Boolean(vendorAccount) };
}

/**
 * Resolve the effective active mode: honor the stored preference when the user
 * actually has that capability, otherwise fall back to whichever capability
 * exists (couple first), and default to couple when they have neither yet.
 */
export function resolveActiveMode(
	preferences: UserPreferences,
	capabilities: Capabilities,
): ActiveMode {
	const preferred = preferences.activeMode;
	if (preferred === "vendor" && capabilities.isVendor) return "vendor";
	if (preferred === "couple" && capabilities.isCouple) return "couple";
	if (capabilities.isCouple) return "couple";
	if (capabilities.isVendor) return "vendor";
	return preferred ?? "couple";
}

/**
 * Create the backing row for a capability if it doesn't already exist. Idempotent
 * via the unique constraints (`weddings.owner_user_id`, `vendor_accounts.user_id`)
 * plus `onConflictDoNothing`, so concurrent calls can't create duplicates.
 */
export async function provisionCapability(
	dbUserId: number,
	capability: ActiveMode,
) {
	if (capability === "couple") {
		const existing = await db.query.weddings.findFirst({
			where: eq(weddings.ownerUserId, dbUserId),
			columns: { id: true },
		});
		if (!existing) {
			await db
				.insert(weddings)
				.values({
					ownerUserId: dbUserId,
					createdBy: dbUserId,
					updatedBy: dbUserId,
				})
				.onConflictDoNothing({ target: weddings.ownerUserId });
		}
		return;
	}

	const existing = await db.query.vendorAccounts.findFirst({
		where: eq(vendorAccounts.userId, dbUserId),
		columns: { id: true },
	});
	if (!existing) {
		await db
			.insert(vendorAccounts)
			.values({ userId: dbUserId, createdBy: dbUserId, updatedBy: dbUserId })
			.onConflictDoNothing({ target: vendorAccounts.userId });
	}
}

/** Merge a per-capability onboarding completion flag into user preferences. */
export async function markOnboardingComplete(
	dbUserId: number,
	capability: ActiveMode,
) {
	const preferences = await getUserPreferences(dbUserId);
	const onboarding = { ...preferences.onboarding, [capability]: true };
	await updateUserPreferences(dbUserId, { onboarding });
}

/** The `user.me` payload: base user plus derived identity for the app shell. */
export async function getMe(dbUserId: number) {
	const user = await getUserById(dbUserId);
	const capabilities = await getCapabilities(dbUserId);
	return {
		...user,
		capabilities,
		activeMode: resolveActiveMode(user.preferences, capabilities),
		onboarding: {
			couple: user.preferences.onboarding?.couple === true,
			vendor: user.preferences.onboarding?.vendor === true,
		},
	};
}

export async function setActiveMode(dbUserId: number, mode: ActiveMode) {
	const capabilities = await getCapabilities(dbUserId);
	const hasCapability =
		mode === "couple" ? capabilities.isCouple : capabilities.isVendor;
	if (!hasCapability) {
		throw new ORPCError("FORBIDDEN", {
			message: `You don't have a ${mode} workspace yet`,
		});
	}
	await updateUserPreferences(dbUserId, { activeMode: mode });
	return getMe(dbUserId);
}
