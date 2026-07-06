import { z } from "zod";

const HexColor = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color (e.g. #A21C3B)");

const StyleTag = z.string().trim().min(1).max(40);

/**
 * Lightweight couple onboarding capture — enough to personalize the dashboard
 * and give the (later) planner/matching real signal. Checklist/budget
 * generation is a separate step; this only persists the wedding basics.
 */
export const CoupleOnboardingInput = z.object({
	weddingDate: z.coerce.date().optional(),
	estimatedBudgetCents: z
		.number()
		.int("Enter a whole amount")
		.min(1, "Enter your estimated budget")
		.max(1_000_000_000, "That budget looks too large"),
	guestCountEstimate: z
		.number()
		.int("Enter a whole number")
		.min(1, "Enter an estimated guest count")
		.max(100_000, "That guest count looks too large"),
	city: z.string().trim().min(1, "Enter your wedding city").max(120),
	region: z.string().trim().max(120).optional(),
	styleTags: z
		.array(StyleTag)
		.min(1, "Pick at least one style")
		.max(12, "Choose up to 12 styles"),
	stylePalette: z.array(HexColor).max(8, "Choose up to 8 colors").default([]),
});

export type CoupleOnboardingInput = z.infer<typeof CoupleOnboardingInput>;

/**
 * Lightweight vendor onboarding capture — creates the vendor's first (draft,
 * unpublished) profile. Packages, portfolio, and publishing come later.
 */
export const VendorOnboardingInput = z.object({
	businessName: z.string().trim().min(2, "Enter your business name").max(120),
	categoryUuid: z.string().uuid("Choose a category"),
	region: z.string().trim().min(1, "Enter the region you serve").max(120),
	city: z.string().trim().max(120).optional(),
	tagline: z.string().trim().max(200).optional(),
});

export type VendorOnboardingInput = z.infer<typeof VendorOnboardingInput>;
