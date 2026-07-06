import { Container, LandingButton, LinkCta } from "../primitives";
import { Reveal } from "../reveal";

const signUp = { pathname: "/sign-up/" as const, query: { intent: "vendor" } };

export function ClosingCta() {
	return (
		<section className="sec-forest">
			<Container className="py-24 md:py-32">
				<Reveal className="max-w-2xl">
					<h2 className="display text-4xl sm:text-5xl">
						Your next booking is a couple who already trusts you.
					</h2>
					<p className="ink-soft mt-5 text-lg leading-relaxed">
						Build a profile, publish your pricing, and let your collaborators
						vouch for your work.
					</p>
					<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
						<LandingButton href={signUp} onForest>
							List your business
						</LandingButton>
						<LinkCta href="/" className="sm:ml-2">
							Planning your own wedding?
						</LinkCta>
					</div>
				</Reveal>
			</Container>
		</section>
	);
}
