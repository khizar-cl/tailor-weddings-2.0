import { oc } from "@orpc/contract";
import {
	AddCapabilityInput,
	AuthSuccess,
	CompleteProfileInput,
	MeSchema,
} from "@repo/shared";

export const authContract = {
	completeProfile: oc.input(CompleteProfileInput).output(AuthSuccess),
	addCapability: oc.input(AddCapabilityInput).output(MeSchema),
};
