import type { Metadata } from "next";
import { LandingFooter, LandingNav } from "../../components/landing/chrome";
import { ClosingCta } from "../../components/landing/vendors/closing-cta";
import { Comparison } from "../../components/landing/vendors/comparison";
import { Hero } from "../../components/landing/vendors/hero";
import { HowItWorks } from "../../components/landing/vendors/how-it-works";
import { OfferingsBento } from "../../components/landing/vendors/offerings-bento";
import { PeerReviewFeature } from "../../components/landing/vendors/peer-review-feature";
import { Plans } from "../../components/landing/vendors/plans";
import { SpecialtyRow } from "../../components/landing/vendors/specialty-row";
import { VendorQuote } from "../../components/landing/vendors/vendor-quote";
import { SignedInRedirect } from "../../components/signed-in-redirect";

export const metadata: Metadata = {
	title: "Tailor Weddings for professionals: grow on your reputation",
	description:
		"Show your work, publish real pricing, and earn peer reviews from the vendors you collaborate with. Meet couples who fit your style, not your spam folder.",
};

export default function VendorsLandingPage() {
	return (
		<>
			<SignedInRedirect />
			<div className="landing flex min-h-dvh flex-col">
				<LandingNav audience="vendor" />
				<main className="flex-1">
					<Hero />
					<SpecialtyRow />
					<Comparison />
					<OfferingsBento />
					<PeerReviewFeature />
					<HowItWorks />
					<VendorQuote />
					<Plans />
					<ClosingCta />
				</main>
				<LandingFooter audience="vendor" />
			</div>
		</>
	);
}
