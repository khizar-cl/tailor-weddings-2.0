import { authContract } from "./auth.contract";
import { categoryContract } from "./category.contract";
import { checklistContract } from "./checklist.contract";
import { emailContract } from "./email.contract";
import { onboardingContract } from "./onboarding.contract";
import { storageContract } from "./storage.contract";
import { userContract } from "./user.contract";
import { weddingContract } from "./wedding.contract";

export const appContract = {
	auth: authContract,
	category: categoryContract,
	checklist: checklistContract,
	email: emailContract,
	onboarding: onboardingContract,
	storage: storageContract,
	user: userContract,
	wedding: weddingContract,
};
