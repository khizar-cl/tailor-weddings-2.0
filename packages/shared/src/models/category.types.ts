import { z } from "zod";

export const CategoryItem = z.object({
	uuid: z.string().uuid(),
	slug: z.string(),
	name: z.string(),
});

export type CategoryItem = z.infer<typeof CategoryItem>;

export const CategoryList = z.object({
	categories: z.array(CategoryItem),
});

export type CategoryList = z.infer<typeof CategoryList>;
