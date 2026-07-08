import { authController } from "./auth/auth.controller";
import { categoryController } from "./category/category.controller";
import { checklistController } from "./checklist/checklist.controller";
import { emailController } from "./email/email.controller";
import { onboardingController } from "./onboarding/onboarding.controller";
import { storageController } from "./storage/storage.controller";
import { userController } from "./user/user.controller";

export const appRouter = {
	auth: authController,
	category: categoryController,
	checklist: checklistController,
	email: emailController,
	onboarding: onboardingController,
	storage: storageController,
	user: userController,
};
