import vendorHero from "../../../assets/images/landing/vendor-hero.jpg";
import {
	Container,
	Docket,
	Eyebrow,
	LandingButton,
	SwatchMedia,
} from "../primitives";

const signUp = { pathname: "/sign-up/" as const, query: { intent: "vendor" } };

export function Hero() {
	return (
		<section className="hairline border-b">
			<Container className="grid items-center gap-12 py-16 md:grid-cols-12 md:py-28">
				<div className="stagger md:col-span-7">
					<Eyebrow>For wedding professionals</Eyebrow>
					<h1 className="display text-5xl sm:text-6xl lg:text-7xl">
						Grow on your{" "}
						<span className="stitch-draw accent-text">reputation</span>.
					</h1>
					<p className="ink-soft mt-7 max-w-lg text-lg leading-relaxed">
						Show your work, publish your pricing, and earn reviews from the
						vendors you collaborate with — a reputation cut from real events,
						not ad spend.
					</p>
					<div className="mt-9 flex flex-col gap-3 sm:flex-row">
						<LandingButton href={signUp}>List your business</LandingButton>
						<LandingButton
							href={{ pathname: "/vendors", hash: "how" }}
							variant="secondary"
						>
							See how it works
						</LandingButton>
					</div>
					<Docket className="mt-9">
						Free to list · Peer-verified reviews · Keep your pricing
					</Docket>
				</div>
				<div className="relative md:col-span-5">
					<SwatchMedia
						src={vendorHero}
						alt="A wedding photographer working during a celebration"
						ratioClassName="aspect-[4/5]"
						priority
						tag
					/>
				</div>
			</Container>
		</section>
	);
}
