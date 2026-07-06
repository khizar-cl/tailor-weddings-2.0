import { Container, Eyebrow, LandingButton, Media } from "../primitives";

const signUp = { pathname: "/sign-up/" as const, query: { intent: "vendor" } };

export function Hero() {
	return (
		<section className="hairline border-b">
			<Container className="grid items-center gap-12 py-16 md:grid-cols-12 md:py-24">
				<div className="stagger md:col-span-7">
					<Eyebrow>For wedding professionals</Eyebrow>
					<h1 className="display text-5xl sm:text-6xl lg:text-7xl">
						Grow on your reputation.
					</h1>
					<p className="ink-soft mt-6 max-w-lg text-lg leading-relaxed">
						Show your work, publish your pricing, and earn reviews from the
						vendors you collaborate with.
					</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<LandingButton href={signUp}>List your business</LandingButton>
						<LandingButton
							href={{ pathname: "/vendors", hash: "how" }}
							variant="secondary"
						>
							See how it works
						</LandingButton>
					</div>
				</div>
				<div className="relative md:col-span-5">
					<Media
						keywords="wedding,photographer,camera"
						lock={131}
						alt="A wedding photographer working during a celebration"
						ratioClassName="aspect-[4/5]"
						width={900}
						height={1125}
						priority
						zoom
					/>
				</div>
			</Container>
		</section>
	);
}
