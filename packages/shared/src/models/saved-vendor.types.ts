import { z } from "zod";

export const SaveVendorInputSchema = z.object({
	vendorBusinessUuid: z.string().uuid(),
	notes: z.string().trim().max(1000).optional(),
});
export type SaveVendorInputSchema = z.infer<typeof SaveVendorInputSchema>;

export const UnsaveVendorInputSchema = z.object({
	vendorBusinessUuid: z.string().uuid(),
});
export type UnsaveVendorInputSchema = z.infer<typeof UnsaveVendorInputSchema>;

/** A business on the couple's private shortlist ("my team"). */
export const SavedVendorSchema = z.object({
	uuid: z.string().uuid(),
	vendorBusinessUuid: z.string().uuid(),
	businessName: z.string(),
	city: z.string().nullable(),
	region: z.string().nullable(),
	isVerified: z.boolean(),
	logoUrl: z.string().nullable(),
	primaryCategoryName: z.string().nullable(),
	notes: z.string().nullable(),
	savedAt: z.date(),
});
export type SavedVendorSchema = z.infer<typeof SavedVendorSchema>;

export const SavedVendorListSchema = z.object({
	items: z.array(SavedVendorSchema),
});
export type SavedVendorListSchema = z.infer<typeof SavedVendorListSchema>;

export const UnsaveVendorResultSchema = z.object({
	removed: z.boolean(),
});
export type UnsaveVendorResultSchema = z.infer<typeof UnsaveVendorResultSchema>;
