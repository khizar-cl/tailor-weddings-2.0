import { protectedProcedure } from "../../orpc/procedures";
import {
	addVendorPackage,
	addVendorService,
	getVendorProfile,
	removePortfolioImage,
	removeVendorPackage,
	removeVendorService,
	reorderPortfolio,
	setServicePrimary,
	setServicePublish,
	updateVendorBusiness,
	updateVendorPackage,
	updateVendorService,
	uploadPortfolioImage,
	uploadVendorLogo,
} from "./vendor-profile.service";

export const vendorProfileController = {
	get: protectedProcedure.vendorProfile.get.handler(async ({ context }) => {
		return getVendorProfile(context.dbUser.id);
	}),

	updateBusiness: protectedProcedure.vendorProfile.updateBusiness.handler(
		async ({ context, input }) => {
			return updateVendorBusiness(context.dbUser.id, input);
		},
	),

	uploadLogo: protectedProcedure.vendorProfile.uploadLogo.handler(
		async ({ context, input }) => {
			return uploadVendorLogo(context.dbUser, input.file);
		},
	),

	addService: protectedProcedure.vendorProfile.addService.handler(
		async ({ context, input }) => {
			return addVendorService(context.dbUser.id, input);
		},
	),

	updateService: protectedProcedure.vendorProfile.updateService.handler(
		async ({ context, input }) => {
			return updateVendorService(context.dbUser.id, input);
		},
	),

	removeService: protectedProcedure.vendorProfile.removeService.handler(
		async ({ context, input }) => {
			return removeVendorService(context.dbUser.id, input.serviceUuid);
		},
	),

	setServicePrimary: protectedProcedure.vendorProfile.setServicePrimary.handler(
		async ({ context, input }) => {
			return setServicePrimary(context.dbUser.id, input.serviceUuid);
		},
	),

	setServicePublish: protectedProcedure.vendorProfile.setServicePublish.handler(
		async ({ context, input }) => {
			return setServicePublish(context.dbUser.id, input);
		},
	),

	addPackage: protectedProcedure.vendorProfile.addPackage.handler(
		async ({ context, input }) => {
			return addVendorPackage(context.dbUser.id, input);
		},
	),

	updatePackage: protectedProcedure.vendorProfile.updatePackage.handler(
		async ({ context, input }) => {
			return updateVendorPackage(context.dbUser.id, input);
		},
	),

	removePackage: protectedProcedure.vendorProfile.removePackage.handler(
		async ({ context, input }) => {
			return removeVendorPackage(context.dbUser.id, input.packageUuid);
		},
	),

	uploadPortfolio: protectedProcedure.vendorProfile.uploadPortfolio.handler(
		async ({ context, input }) => {
			return uploadPortfolioImage(context.dbUser, input);
		},
	),

	removePortfolio: protectedProcedure.vendorProfile.removePortfolio.handler(
		async ({ context, input }) => {
			return removePortfolioImage(context.dbUser.id, input.portfolioUuid);
		},
	),

	reorderPortfolio: protectedProcedure.vendorProfile.reorderPortfolio.handler(
		async ({ context, input }) => {
			return reorderPortfolio(context.dbUser.id, input);
		},
	),
};
