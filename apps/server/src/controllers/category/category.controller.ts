import { publicProcedure } from "../../orpc/procedures";
import { listCategories } from "./category.service";

export const categoryController = {
	list: publicProcedure.category.list.handler(async () => {
		return listCategories();
	}),
};
