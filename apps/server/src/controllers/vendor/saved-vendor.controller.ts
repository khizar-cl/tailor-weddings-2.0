import { protectedProcedure } from "../../orpc/procedures";
import {
	listSavedVendors,
	saveVendor,
	unsaveVendor,
} from "./saved-vendor.service";

export const savedVendorController = {
	list: protectedProcedure.savedVendor.list.handler(async ({ context }) => {
		return listSavedVendors(context.dbUser.id);
	}),

	save: protectedProcedure.savedVendor.save.handler(
		async ({ context, input }) => {
			return saveVendor(context.dbUser.id, input);
		},
	),

	unsave: protectedProcedure.savedVendor.unsave.handler(
		async ({ context, input }) => {
			return unsaveVendor(context.dbUser.id, input);
		},
	),
};
