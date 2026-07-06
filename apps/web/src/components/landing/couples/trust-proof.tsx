import { Container } from "../primitives";
import { Reveal } from "../reveal";

const proof = [
	{
		title: "Peer verified",
		body: "Vendors review the professionals they worked beside, tied to a real event.",
	},
	{
		title: "Priced in the open",
		body: "Real service packages with real numbers, so there are no surprise quotes.",
	},
	{
		title: "One place",
		body: "Your checklist, budget, and whole team live together, from hello to the last dance.",
	},
];

export function TrustProof() {
	return (
		<section className="hairline border-b">
			<Container className="py-20 md:py-28">
				<Reveal>
					<h2 className="display max-w-[16ch] text-3xl sm:text-4xl md:text-5xl">
						Reviews from the people who were{" "}
						<span className="accent-text">actually there.</span>
					</h2>
				</Reveal>
				<div className="mt-12 grid gap-px overflow-hidden rounded-md bg-border sm:grid-cols-3">
					{proof.map((item, i) => (
						<Reveal
							key={item.title}
							delay={i * 90}
							className="bg-background p-6 md:p-8"
						>
							<p className="font-semibold text-lg">{item.title}</p>
							<p className="ink-soft mt-2 text-sm leading-relaxed">
								{item.body}
							</p>
						</Reveal>
					))}
				</div>
			</Container>
		</section>
	);
}
