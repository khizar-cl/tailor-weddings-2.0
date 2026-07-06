import { ORPCError } from "@orpc/server";
import type { ActiveMode, CompleteProfileInput } from "@repo/shared";
import { eq } from "drizzle-orm";
import { db, users } from "../../db";
import {
	getMe,
	provisionCapability,
	updateUserPreferences,
} from "../user/user.service";

export async function completeUserProfile(
	dbUserId: number,
	input: CompleteProfileInput,
) {
	// `input.role` is intentionally ignored: this is a client-callable procedure,
	// so honoring a client-supplied role would let anyone self-assign admin. The
	// field is kept on the contract only for mobile backward-compatibility.
	const [updated] = await db
		.update(users)
		.set({
			name: input.name,
			updatedBy: dbUserId,
			updatedAt: new Date(),
		})
		.where(eq(users.id, dbUserId))
		.returning({ uuid: users.uuid });

	if (!updated) {
		throw new ORPCError("NOT_FOUND", { message: "User not found" });
	}

	return { success: true as const };
}

/**
 * Add the other capability to an existing user (the "set up your … side" path
 * from the mode switcher): provision its backing row and switch the active mode
 * to it. The subsequent onboarding flow for that side is still required.
 */
export async function addCapability(dbUserId: number, capability: ActiveMode) {
	await provisionCapability(dbUserId, capability);
	await updateUserPreferences(dbUserId, { activeMode: capability });
	return getMe(dbUserId);
}
