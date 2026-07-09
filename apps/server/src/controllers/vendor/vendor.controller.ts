import { protectedProcedure } from "../../orpc/procedures";
import { getVendorByUuid, searchVendors } from "./vendor.service";

export const vendorController = {
	search: protectedProcedure.vendor.search.handler(
		async ({ context, input }) => {
			return searchVendors(context.dbUser.id, input);
		},
	),

	getByUuid: protectedProcedure.vendor.getByUuid.handler(
		async ({ context, input }) => {
			return getVendorByUuid(context.dbUser.id, input.uuid);
		},
	),
};
