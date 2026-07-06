import { oc } from "@orpc/contract";
import {
	CoupleOnboardingInput,
	MeSchema,
	VendorOnboardingInput,
} from "@repo/shared";

export const onboardingContract = {
	submitCouple: oc.input(CoupleOnboardingInput).output(MeSchema),
	submitVendor: oc.input(VendorOnboardingInput).output(MeSchema),
};
