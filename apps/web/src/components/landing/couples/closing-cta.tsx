import { Container, LandingButton, LinkCta } from "../primitives";
import { Reveal } from "../reveal";

const signUp = { pathname: "/sign-up/" as const, query: { intent: "couple" } };

export function ClosingCta() {
	return (
		<section className="sec-ink">
			<Container className="py-24 md:py-32">
				<Reveal className="max-w-2xl">
					<p className="eyebrow mb-5">The last stitch</p>
					<h2 className="display text-4xl sm:text-5xl">
						Find the people who will make your day.
					</h2>
					<p className="ink-soft mt-5 text-lg leading-relaxed">
						Start with a few questions. Keep the plan, the budget, and the team
						that comes out of it.
					</p>
					<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
						<LandingButton href={signUp} onForest>
							Plan your wedding
						</LandingButton>
						<LinkCta href="/vendors" className="sm:ml-2">
							Are you a wedding professional?
						</LinkCta>
					</div>
				</Reveal>
			</Container>
		</section>
	);
}
