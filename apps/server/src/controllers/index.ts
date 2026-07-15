import { authController } from "./auth/auth.controller";
import { bookingController } from "./booking/booking.controller";
import { budgetController } from "./budget/budget.controller";
import { categoryController } from "./category/category.controller";
import { checklistController } from "./checklist/checklist.controller";
import { emailController } from "./email/email.controller";
import { messagingController } from "./messaging/messaging.controller";
import { onboardingController } from "./onboarding/onboarding.controller";
import { reviewController } from "./review/review.controller";
import { storageController } from "./storage/storage.controller";
import { userController } from "./user/user.controller";
import { savedVendorController } from "./vendor/saved-vendor.controller";
import { vendorController } from "./vendor/vendor.controller";
import { vendorProfileController } from "./vendor/vendor-profile.controller";
import { weddingController } from "./wedding/wedding.controller";

export const appRouter = {
	auth: authController,
	booking: bookingController,
	budget: budgetController,
	category: categoryController,
	checklist: checklistController,
	email: emailController,
	messaging: messagingController,
	onboarding: onboardingController,
	review: reviewController,
	savedVendor: savedVendorController,
	storage: storageController,
	user: userController,
	vendor: vendorController,
	vendorProfile: vendorProfileController,
	wedding: weddingController,
};
