import { oc } from "@orpc/contract";
import {
	SavedVendorListSchema,
	SavedVendorSchema,
	SaveVendorInputSchema,
	UnsaveVendorInputSchema,
	UnsaveVendorResultSchema,
} from "@repo/shared";

export const savedVendorContract = {
	list: oc.output(SavedVendorListSchema),
	save: oc.input(SaveVendorInputSchema).output(SavedVendorSchema),
	unsave: oc.input(UnsaveVendorInputSchema).output(UnsaveVendorResultSchema),
};
