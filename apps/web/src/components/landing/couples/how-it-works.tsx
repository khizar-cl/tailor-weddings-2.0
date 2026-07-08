import { Container, MetaRail } from "../primitives";
import { Reveal } from "../reveal";

const steps = [
	{
		title: "Tell us about your day",
		body: "Your date, budget, guest count, and style. A few questions, no account maze.",
	},
	{
		title: "Get a tailored plan",
		body: "A checklist, a starter budget, and vendors matched to your style and price range.",
	},
	{
		title: "Build your team",
		body: "Save your favorites, book with confidence, and manage everyone from one dashboard.",
	},
];

export function HowItWorks() {
	return (
		<section id="how" className="hairline scroll-mt-20 border-b">
			<Container className="py-20 md:py-28">
				<MetaRail index="02" label="The fitting">
					<h2 className="display max-w-[16ch] text-3xl sm:text-4xl md:text-5xl">
						From overwhelmed to organized, in three steps.
					</h2>
					<ol className="m-0 mt-12 list-none p-0">
						{steps.map((step, i) => (
							<Reveal
								as="li"
								key={step.title}
								delay={i * 80}
								className="grid items-baseline gap-3 py-8 md:grid-cols-12 md:gap-8"
							>
								<span className="docket-num text-2xl accent-text md:col-span-2">
									{String(i + 1).padStart(2, "0")}
								</span>
								<h3 className="m-0 font-semibold text-xl md:col-span-4">
									{step.title}
								</h3>
								<p className="ink-soft m-0 leading-relaxed md:col-span-6">
									{step.body}
								</p>
								{i < steps.length - 1 ? (
									<hr
										className="stitch-rule mt-8 opacity-70 md:col-span-12"
										aria-hidden
									/>
								) : null}
							</Reveal>
						))}
					</ol>
				</MetaRail>
			</Container>
		</section>
	);
}
