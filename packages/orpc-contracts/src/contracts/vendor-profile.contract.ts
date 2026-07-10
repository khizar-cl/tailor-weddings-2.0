import { oc } from "@orpc/contract";
import {
	AddVendorPackageInputSchema,
	AddVendorServiceInputSchema,
	ReorderPortfolioInputSchema,
	SetServicePublishInputSchema,
	UpdateVendorBusinessInputSchema,
	UpdateVendorPackageInputSchema,
	UpdateVendorServiceInputSchema,
	UploadLogoInputSchema,
	UploadPortfolioInputSchema,
	VendorPackageUuidInputSchema,
	VendorPortfolioUuidInputSchema,
	VendorProfileSchema,
	VendorServiceUuidInputSchema,
} from "@repo/shared";

/**
 * The vendor's listing editor. Every mutation returns the full refreshed
 * profile so the client keeps a single source of truth for its cache.
 */
export const vendorProfileContract = {
	get: oc.output(VendorProfileSchema),
	updateBusiness: oc
		.input(UpdateVendorBusinessInputSchema)
		.output(VendorProfileSchema),
	uploadLogo: oc.input(UploadLogoInputSchema).output(VendorProfileSchema),
	addService: oc.input(AddVendorServiceInputSchema).output(VendorProfileSchema),
	updateService: oc
		.input(UpdateVendorServiceInputSchema)
		.output(VendorProfileSchema),
	removeService: oc
		.input(VendorServiceUuidInputSchema)
		.output(VendorProfileSchema),
	setServicePrimary: oc
		.input(VendorServiceUuidInputSchema)
		.output(VendorProfileSchema),
	setServicePublish: oc
		.input(SetServicePublishInputSchema)
		.output(VendorProfileSchema),
	addPackage: oc.input(AddVendorPackageInputSchema).output(VendorProfileSchema),
	updatePackage: oc
		.input(UpdateVendorPackageInputSchema)
		.output(VendorProfileSchema),
	removePackage: oc
		.input(VendorPackageUuidInputSchema)
		.output(VendorProfileSchema),
	uploadPortfolio: oc
		.input(UploadPortfolioInputSchema)
		.output(VendorProfileSchema),
	removePortfolio: oc
		.input(VendorPortfolioUuidInputSchema)
		.output(VendorProfileSchema),
	reorderPortfolio: oc
		.input(ReorderPortfolioInputSchema)
		.output(VendorProfileSchema),
};
