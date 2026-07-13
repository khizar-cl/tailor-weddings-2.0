import { oc } from "@orpc/contract";
import { WeddingSummarySchema, WeddingTeamSchema } from "@repo/shared";

export const weddingContract = {
	getSummary: oc.output(WeddingSummarySchema),
	getTeam: oc.output(WeddingTeamSchema),
};
