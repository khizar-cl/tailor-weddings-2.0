import { oc } from "@orpc/contract";
import { WeddingSummarySchema } from "@repo/shared";

export const weddingContract = {
	getSummary: oc.output(WeddingSummarySchema),
};
