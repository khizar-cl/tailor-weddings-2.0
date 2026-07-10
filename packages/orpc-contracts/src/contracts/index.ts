import { authContract } from "./auth.contract";
import { categoryContract } from "./category.contract";
import { checklistContract } from "./checklist.contract";
import { emailContract } from "./email.contract";
import { onboardingContract } from "./onboarding.contract";
import { savedVendorContract } from "./saved-vendor.contract";
import { storageContract } from "./storage.contract";
import { userContract } from "./user.contract";
import { vendorContract } from "./vendor.contract";
import { vendorProfileContract } from "./vendor-profile.contract";
import { weddingContract } from "./wedding.contract";

export const appContract = {
	auth: authContract,
	category: categoryContract,
	checklist: checklistContract,
	email: emailContract,
	onboarding: onboardingContract,
	savedVendor: savedVendorContract,
	storage: storageContract,
	user: userContract,
	vendor: vendorContract,
	vendorProfile: vendorProfileContract,
	wedding: weddingContract,
};
