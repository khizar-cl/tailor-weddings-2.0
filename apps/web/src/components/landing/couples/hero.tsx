import heroCouple from "../../../assets/images/landing/hero-couple.jpg";
import {
	Container,
	Docket,
	Eyebrow,
	LandingButton,
	SwatchMedia,
} from "../primitives";

const signUp = { pathname: "/sign-up/" as const, query: { intent: "couple" } };

export function Hero() {
	return (
		<section className="hairline border-b">
			<Container className="grid items-center gap-10 py-16 md:grid-cols-12 md:gap-14 md:py-28">
				<div className="stagger md:col-span-7">
					<Eyebrow>Measured for you</Eyebrow>
					<h1 className="display text-5xl sm:text-6xl lg:text-7xl">
						A wedding <span className="stitch-draw accent-text">tailored</span>{" "}
						to the two of you.
					</h1>
					<p className="ink-soft mt-7 max-w-lg text-lg leading-relaxed">
						Answer a few questions. We fit you with a checklist, a starter
						budget, and a team of vendors matched to your style — measured to
						your day, not a template.
					</p>
					<div className="mt-9 flex flex-col gap-3 sm:flex-row">
						<LandingButton href={signUp}>Start your fitting</LandingButton>
						<LandingButton
							href={{ pathname: "/", hash: "how" }}
							variant="secondary"
						>
							See how it works
						</LandingButton>
					</div>
					<Docket className="mt-9">
						No account maze · Free while you plan · Est. 2026
					</Docket>
				</div>
				<div className="md:col-span-5">
					<SwatchMedia
						src={heroCouple}
						alt="A couple embracing on their wedding day"
						ratioClassName="aspect-[4/5]"
						priority
						tag
					/>
				</div>
			</Container>
		</section>
	);
}
