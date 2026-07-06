import { z } from "zod";

export const UserRoleEnum = z.enum(["admin", "member"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const Roles = {
	ADMIN: "admin",
	MEMBER: "member",
} as const satisfies Record<string, UserRole>;

/**
 * A user's active area of the app. Derived capabilities decide which modes are
 * reachable; this only records which one they're currently in. Also doubles as
 * the sign-up `intent` written to Clerk metadata (couple vs vendor landing).
 */
export const ActiveModeEnum = z.enum(["couple", "vendor"]);
export type ActiveMode = z.infer<typeof ActiveModeEnum>;

/** Per-capability onboarding completion, persisted in user preferences. */
export const OnboardingProgress = z.object({
	couple: z.boolean().optional(),
	vendor: z.boolean().optional(),
});

export type OnboardingProgress = z.infer<typeof OnboardingProgress>;

export const UserPreferences = z.looseObject({
	theme: z.enum(["light", "dark", "system"]).optional(),
	activeMode: ActiveModeEnum.optional(),
	onboarding: OnboardingProgress.optional(),
});

export type UserPreferences = z.infer<typeof UserPreferences>;

/**
 * Capabilities are derived from row ownership, never stored: `isCouple` when the
 * user owns or partners a wedding, `isVendor` when they own a vendor account.
 */
export const Capabilities = z.object({
	isCouple: z.boolean(),
	isVendor: z.boolean(),
});

export type Capabilities = z.infer<typeof Capabilities>;

/** Resolved onboarding completion returned to the client (never partial). */
export const OnboardingStatus = z.object({
	couple: z.boolean(),
	vendor: z.boolean(),
});

export type OnboardingStatus = z.infer<typeof OnboardingStatus>;

export const UserSchema = z.object({
	uuid: z.string().uuid(),
	email: z.string(),
	name: z.string(),
	role: UserRoleEnum,
	imageUrl: z.string().nullable(),
	preferences: UserPreferences,
	createdBy: z.string().uuid().nullable(),
	createdAt: z.date(),
	updatedBy: z.string().uuid().nullable(),
	updatedAt: z.date(),
});

export type UserSchema = z.infer<typeof UserSchema>;

/**
 * The `user.me` payload: the base user plus identity fields the shell needs to
 * pick a route tree. Extends UserSchema additively so existing consumers (incl.
 * mobile) keep compiling.
 */
export const MeSchema = UserSchema.extend({
	capabilities: Capabilities,
	activeMode: ActiveModeEnum,
	onboarding: OnboardingStatus,
});

export type MeSchema = z.infer<typeof MeSchema>;

export const SetActiveModeInput = z.object({ mode: ActiveModeEnum });
export type SetActiveModeInput = z.infer<typeof SetActiveModeInput>;

export const AddCapabilityInput = z.object({ capability: ActiveModeEnum });
export type AddCapabilityInput = z.infer<typeof AddCapabilityInput>;

export const UserListItem = z.object({
	uuid: z.string().uuid(),
	email: z.string(),
	name: z.string(),
	role: UserRoleEnum,
	imageUrl: z.string().nullable(),
	createdAt: z.date(),
});

export type UserListItem = z.infer<typeof UserListItem>;

export const UserList = z.object({
	users: z.array(UserListItem),
});

export type UserList = z.infer<typeof UserList>;
