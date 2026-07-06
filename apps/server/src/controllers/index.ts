import { authController } from "./auth/auth.controller";
import { categoryController } from "./category/category.controller";
import { emailController } from "./email/email.controller";
import { storageController } from "./storage/storage.controller";
import { userController } from "./user/user.controller";

export const appRouter = {
	auth: authController,
	category: categoryController,
	email: emailController,
	storage: storageController,
	user: userController,
};
