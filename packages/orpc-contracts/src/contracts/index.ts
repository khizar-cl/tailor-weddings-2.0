import { authContract } from "./auth.contract";
import { categoryContract } from "./category.contract";
import { emailContract } from "./email.contract";
import { onboardingContract } from "./onboarding.contract";
import { storageContract } from "./storage.contract";
import { userContract } from "./user.contract";

export const appContract = {
	auth: authContract,
	category: categoryContract,
	email: emailContract,
	onboarding: onboardingContract,
	storage: storageContract,
	user: userContract,
};
