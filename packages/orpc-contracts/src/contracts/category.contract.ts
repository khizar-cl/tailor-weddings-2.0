import { oc } from "@orpc/contract";
import { CategoryList } from "@repo/shared";

export const categoryContract = {
	list: oc.output(CategoryList),
};
