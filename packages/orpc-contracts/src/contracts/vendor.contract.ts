import { oc } from "@orpc/contract";
import {
	VendorDetailInputSchema,
	VendorDetailSchema,
	VendorSearchInputSchema,
	VendorSearchResultSchema,
} from "@repo/shared";

export const vendorContract = {
	search: oc.input(VendorSearchInputSchema).output(VendorSearchResultSchema),
	getByUuid: oc.input(VendorDetailInputSchema).output(VendorDetailSchema),
};
