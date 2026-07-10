import { z } from "zod";
import { PriceUnitEnum, SubscriptionTierEnum } from "./vendor.types";

/**
 * The vendor's own editable listing. Unlike the couple-facing discovery/detail
 * shapes, this exposes every service (published or not, custom or taxonomy) and
 * the tier limits the editor enforces against.
 */

// ----- Output -----

export const VendorProfilePackageSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	priceCents: z.number().int(),
	priceUnit: PriceUnitEnum,
});
export type VendorProfilePackageSchema = z.infer<
	typeof VendorProfilePackageSchema
>;

export const VendorProfilePortfolioImageSchema = z.object({
	uuid: z.string().uuid(),
	url: z.string().nullable(),
	caption: z.string().nullable(),
	sortOrder: z.number().int(),
});
export type VendorProfilePortfolioImageSchema = z.infer<
	typeof VendorProfilePortfolioImageSchema
>;

export const VendorProfileServiceSchema = z.object({
	uuid: z.string().uuid(),
	categoryUuid: z.string().uuid().nullable(),
	categoryName: z.string().nullable(),
	customLabel: z.string().nullable(),
	displayName: z.string(),
	description: z.string().nullable(),
	startingPriceCents: z.number().int().nullable(),
	priceUnit: PriceUnitEnum,
	isPrimary: z.boolean(),
	isPublished: z.boolean(),
	// A custom-label service is hidden from discovery until an admin promotes it
	// into a real category.
	isPending: z.boolean(),
	packages: z.array(VendorProfilePackageSchema),
	portfolio: z.array(VendorProfilePortfolioImageSchema),
});
export type VendorProfileServiceSchema = z.infer<
	typeof VendorProfileServiceSchema
>;

export const VendorProfileSchema = z.object({
	uuid: z.string().uuid(),
	businessName: z.string(),
	tagline: z.string().nullable(),
	bio: z.string().nullable(),
	website: z.string().nullable(),
	city: z.string().nullable(),
	region: z.string().nullable(),
	yearsInBusiness: z.number().int().nullable(),
	logoUrl: z.string().nullable(),
	isVerified: z.boolean(),
	tier: SubscriptionTierEnum,
	limits: z.object({
		maxServices: z.number().int(),
		maxPortfolioImagesPerService: z.number().int(),
	}),
	services: z.array(VendorProfileServiceSchema),
});
export type VendorProfileSchema = z.infer<typeof VendorProfileSchema>;

// ----- Inputs -----

export const UpdateVendorBusinessInputSchema = z.object({
	businessName: z.string().trim().min(1, "Enter a business name").max(200),
	region: z.string().trim().min(1, "Enter a region").max(120),
	tagline: z.string().trim().max(200).optional(),
	bio: z.string().trim().max(4000).optional(),
	website: z.string().trim().max(300).optional(),
	city: z.string().trim().max(120).optional(),
	yearsInBusiness: z.number().int().min(0).max(200).optional(),
});
export type UpdateVendorBusinessInputSchema = z.infer<
	typeof UpdateVendorBusinessInputSchema
>;

export const AddVendorServiceInputSchema = z
	.object({
		categoryUuid: z.string().uuid().optional(),
		customLabel: z.string().trim().min(1).max(120).optional(),
		// The starting price is derived from the service's packages, not entered.
		description: z.string().trim().min(1, "Enter a description").max(2000),
	})
	.refine((v) => Boolean(v.categoryUuid) !== Boolean(v.customLabel), {
		message: "Choose a category or enter a custom service, not both",
	});
export type AddVendorServiceInputSchema = z.infer<
	typeof AddVendorServiceInputSchema
>;

export const UpdateVendorServiceInputSchema = z.object({
	serviceUuid: z.string().uuid(),
	customLabel: z.string().trim().min(1).max(120).optional(),
	description: z.string().trim().min(1, "Enter a description").max(2000),
});
export type UpdateVendorServiceInputSchema = z.infer<
	typeof UpdateVendorServiceInputSchema
>;

export const VendorServiceUuidInputSchema = z.object({
	serviceUuid: z.string().uuid(),
});
export type VendorServiceUuidInputSchema = z.infer<
	typeof VendorServiceUuidInputSchema
>;

export const SetServicePublishInputSchema = z.object({
	serviceUuid: z.string().uuid(),
	isPublished: z.boolean(),
});
export type SetServicePublishInputSchema = z.infer<
	typeof SetServicePublishInputSchema
>;

export const AddVendorPackageInputSchema = z.object({
	serviceUuid: z.string().uuid(),
	name: z.string().trim().min(1, "Enter a package name").max(120),
	description: z.string().trim().min(1, "Enter a description").max(2000),
	priceCents: z.number().int().min(0),
	priceUnit: PriceUnitEnum,
});
export type AddVendorPackageInputSchema = z.infer<
	typeof AddVendorPackageInputSchema
>;

export const UpdateVendorPackageInputSchema = z.object({
	packageUuid: z.string().uuid(),
	name: z.string().trim().min(1, "Enter a package name").max(120),
	description: z.string().trim().min(1, "Enter a description").max(2000),
	priceCents: z.number().int().min(0),
	priceUnit: PriceUnitEnum,
});
export type UpdateVendorPackageInputSchema = z.infer<
	typeof UpdateVendorPackageInputSchema
>;

export const VendorPackageUuidInputSchema = z.object({
	packageUuid: z.string().uuid(),
});
export type VendorPackageUuidInputSchema = z.infer<
	typeof VendorPackageUuidInputSchema
>;

export const UploadLogoInputSchema = z.object({
	file: z.custom<File | (Blob & { name: string })>(
		(val) =>
			val instanceof File ||
			(typeof val === "object" &&
				val !== null &&
				"name" in val &&
				"size" in val),
	),
});
export type UploadLogoInput = z.infer<typeof UploadLogoInputSchema>;

export const UploadPortfolioInputSchema = z.object({
	serviceUuid: z.string().uuid(),
	caption: z.string().trim().max(200).optional(),
	file: z.custom<File | (Blob & { name: string })>(
		(val) =>
			val instanceof File ||
			(typeof val === "object" &&
				val !== null &&
				"name" in val &&
				"size" in val),
	),
});
export type UploadPortfolioInput = z.infer<typeof UploadPortfolioInputSchema>;

export const VendorPortfolioUuidInputSchema = z.object({
	portfolioUuid: z.string().uuid(),
});
export type VendorPortfolioUuidInputSchema = z.infer<
	typeof VendorPortfolioUuidInputSchema
>;

export const ReorderPortfolioInputSchema = z.object({
	serviceUuid: z.string().uuid(),
	orderedUuids: z.array(z.string().uuid()).max(50),
});
export type ReorderPortfolioInputSchema = z.infer<
	typeof ReorderPortfolioInputSchema
>;
