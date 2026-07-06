import type { Metadata } from "next";
import { LandingFooter, LandingNav } from "../components/landing/chrome";
import { BudgetFeature } from "../components/landing/couples/budget-feature";
import { CategoryMarquee } from "../components/landing/couples/category-marquee";
import { ClosingCta } from "../components/landing/couples/closing-cta";
import { CoupleQuote } from "../components/landing/couples/couple-quote";
import { Faq } from "../components/landing/couples/faq";
import { Hero } from "../components/landing/couples/hero";
import { HowItWorks } from "../components/landing/couples/how-it-works";
import { TeamBento } from "../components/landing/couples/team-bento";
import { TrustProof } from "../components/landing/couples/trust-proof";
import { SignedInRedirect } from "../components/signed-in-redirect";

export const metadata: Metadata = {
	title: "Tailor Weddings: the wedding team you can trust",
	description:
		"Answer a few questions and get a checklist, a starter budget, and vendors matched to your style. Reviews come from the professionals who worked the event, not anonymous ratings.",
};

export default function CouplesLandingPage() {
	return (
		<>
			<SignedInRedirect />
			<div className="landing flex min-h-dvh flex-col">
				<LandingNav audience="couple" />
				<main className="flex-1">
					<Hero />
					<CategoryMarquee />
					<TrustProof />
					<TeamBento />
					<HowItWorks />
					<BudgetFeature />
					<CoupleQuote />
					<Faq />
					<ClosingCta />
				</main>
				<LandingFooter audience="couple" />
			</div>
		</>
	);
}
