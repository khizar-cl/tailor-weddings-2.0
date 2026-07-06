import { oc } from "@orpc/contract";
import {
	MeSchema,
	SetActiveModeInput,
	UserList,
	UserPreferences,
} from "@repo/shared";

export const userContract = {
	me: oc.output(MeSchema),
	setActiveMode: oc.input(SetActiveModeInput).output(MeSchema),
	getPreferences: oc.output(UserPreferences),
	setPreferences: oc.input(UserPreferences).output(UserPreferences),
	list: oc.output(UserList),
};
