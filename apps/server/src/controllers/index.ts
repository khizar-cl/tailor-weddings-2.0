import { authController } from "./auth/auth.controller";
import { budgetController } from "./budget/budget.controller";
import { categoryController } from "./category/category.controller";
import { checklistController } from "./checklist/checklist.controller";
import { emailController } from "./email/email.controller";
import { onboardingController } from "./onboarding/onboarding.controller";
import { storageController } from "./storage/storage.controller";
import { userController } from "./user/user.controller";
import { savedVendorController } from "./vendor/saved-vendor.controller";
import { vendorController } from "./vendor/vendor.controller";
import { vendorProfileController } from "./vendor/vendor-profile.controller";
import { weddingController } from "./wedding/wedding.controller";

export const appRouter = {
	auth: authController,
	budget: budgetController,
	category: categoryController,
	checklist: checklistController,
	email: emailController,
	onboarding: onboardingController,
	savedVendor: savedVendorController,
	storage: storageController,
	user: userController,
	vendor: vendorController,
	vendorProfile: vendorProfileController,
	wedding: weddingController,
};
