import { z } from "zod";
import { PriceUnitEnum } from "./vendor.types";

export const DISCOVERY_PAGE_SIZE = 12;

/** Filters a couple applies when browsing vendors. All optional. */
export const VendorSearchInputSchema = z.object({
	categoryUuid: z.string().uuid().optional(),
	region: z.string().trim().optional(),
	query: z.string().trim().optional(),
	page: z.number().int().min(1).default(1),
});
export type VendorSearchInputSchema = z.infer<typeof VendorSearchInputSchema>;

/** Aggregate of a business's published client reviews. */
export const VendorRatingSchema = z.object({
	// Mean overall rating (1–5), or null when the business has no reviews yet.
	average: z.number().nullable(),
	count: z.number().int(),
});
export type VendorRatingSchema = z.infer<typeof VendorRatingSchema>;

/**
 * The one service shown on a discovery card — the service matching the searched
 * category, else the business's primary service.
 */
export const VendorCardServiceSchema = z.object({
	categoryName: z.string(),
	categoryUuid: z.string().uuid(),
});
export type VendorCardServiceSchema = z.infer<typeof VendorCardServiceSchema>;

/** A single business in discovery results. */
export const VendorCardSchema = z.object({
	uuid: z.string().uuid(),
	businessName: z.string(),
	tagline: z.string().nullable(),
	city: z.string().nullable(),
	region: z.string().nullable(),
	isVerified: z.boolean(),
	logoUrl: z.string().nullable(),
	featuredService: VendorCardServiceSchema.nullable(),
	fromPriceCents: z.number().int().nullable(),
	rating: VendorRatingSchema,
	isSaved: z.boolean(),
});
export type VendorCardSchema = z.infer<typeof VendorCardSchema>;

export const VendorSearchResultSchema = z.object({
	items: z.array(VendorCardSchema),
	page: z.number().int(),
	pageSize: z.number().int(),
	total: z.number().int(),
	hasMore: z.boolean(),
});
export type VendorSearchResultSchema = z.infer<typeof VendorSearchResultSchema>;

export const VendorDetailInputSchema = z.object({
	uuid: z.string().uuid(),
});
export type VendorDetailInputSchema = z.infer<typeof VendorDetailInputSchema>;

export const VendorPackageSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	priceCents: z.number().int(),
	priceUnit: PriceUnitEnum,
});
export type VendorPackageSchema = z.infer<typeof VendorPackageSchema>;

export const VendorPortfolioImageSchema = z.object({
	uuid: z.string().uuid(),
	url: z.string().nullable(),
	caption: z.string().nullable(),
});
export type VendorPortfolioImageSchema = z.infer<
	typeof VendorPortfolioImageSchema
>;

/** A published service on the vendor detail page, with its packages + portfolio. */
export const VendorServiceDetailSchema = z.object({
	uuid: z.string().uuid(),
	categoryName: z.string(),
	categoryUuid: z.string().uuid(),
	description: z.string().nullable(),
	startingPriceCents: z.number().int().nullable(),
	priceUnit: PriceUnitEnum,
	isPrimary: z.boolean(),
	packages: z.array(VendorPackageSchema),
	portfolio: z.array(VendorPortfolioImageSchema),
});
export type VendorServiceDetailSchema = z.infer<
	typeof VendorServiceDetailSchema
>;

export const VendorDetailSchema = z.object({
	uuid: z.string().uuid(),
	businessName: z.string(),
	tagline: z.string().nullable(),
	bio: z.string().nullable(),
	city: z.string().nullable(),
	region: z.string().nullable(),
	website: z.string().nullable(),
	yearsInBusiness: z.number().int().nullable(),
	isVerified: z.boolean(),
	logoUrl: z.string().nullable(),
	services: z.array(VendorServiceDetailSchema),
	rating: VendorRatingSchema,
	peerEndorsementCount: z.number().int(),
	isSaved: z.boolean(),
});
export type VendorDetailSchema = z.infer<typeof VendorDetailSchema>;
