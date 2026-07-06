import heroCouple from "../../../assets/images/landing/hero-couple.jpg";
import { Container, Eyebrow, LandingButton, Media } from "../primitives";

const signUp = { pathname: "/sign-up/" as const, query: { intent: "couple" } };

export function Hero() {
	return (
		<section className="hairline border-b">
			<Container className="grid items-center gap-10 py-16 md:grid-cols-12 md:gap-12 md:py-24">
				<div className="stagger md:col-span-7">
					<Eyebrow>For couples</Eyebrow>
					<h1 className="display text-5xl sm:text-6xl lg:text-7xl">
						Build a wedding team you trust.
					</h1>
					<p className="ink-soft mt-6 max-w-lg text-lg leading-relaxed">
						Answer a few questions. Get a checklist, a starter budget, and
						vendors matched to your style.
					</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<LandingButton href={signUp}>Plan your wedding</LandingButton>
						<LandingButton
							href={{ pathname: "/", hash: "how" }}
							variant="secondary"
						>
							See how it works
						</LandingButton>
					</div>
				</div>
				<div className="md:col-span-5">
					<Media
						src={heroCouple}
						alt="A couple embracing on their wedding day"
						ratioClassName="aspect-[4/5]"
						priority
						zoom
					/>
				</div>
			</Container>
		</section>
	);
}
