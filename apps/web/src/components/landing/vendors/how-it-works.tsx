import { Container } from "../primitives";
import { Reveal } from "../reveal";

const steps = [
	{
		title: "Create your profile",
		body: "Add your logo, portfolio, and service packages with real pricing.",
	},
	{
		title: "Meet couples who fit",
		body: "Get matched to couples whose style and budget suit your work, not your spam folder.",
	},
	{
		title: "Earn peer reviews",
		body: "After each event, the vendors you worked with vouch for you, and it shows on your profile.",
	},
];

export function HowItWorks() {
	return (
		<section id="how" className="hairline sec-surface scroll-mt-20 border-b">
			<Container className="py-20 md:py-28">
				<h2 className="display max-w-[18ch] text-3xl sm:text-4xl md:text-5xl">
					List once. Let your work and your peers do the rest.
				</h2>
				<ol className="m-0 mt-12 list-none p-0">
					{steps.map((step, i) => (
						<Reveal
							as="li"
							key={step.title}
							delay={i * 80}
							className="hairline grid items-baseline gap-3 border-t py-8 md:grid-cols-12 md:gap-8"
						>
							<span className="display text-4xl tabular-nums accent-text md:col-span-2 md:text-5xl">
								{String(i + 1).padStart(2, "0")}
							</span>
							<h3 className="m-0 font-semibold text-xl md:col-span-4">
								{step.title}
							</h3>
							<p className="ink-soft m-0 leading-relaxed md:col-span-6">
								{step.body}
							</p>
						</Reveal>
					))}
				</ol>
			</Container>
		</section>
	);
}
