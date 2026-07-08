import { Container, MetaRail } from "../primitives";
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
				<MetaRail index="01" label="Why Tailor">
					<Reveal>
						<h2 className="display max-w-[16ch] text-3xl sm:text-4xl md:text-5xl">
							Reviews from the people who were{" "}
							<span className="accent-text">actually there.</span>
						</h2>
					</Reveal>
					<div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
						{proof.map((item, i) => (
							<Reveal key={item.title} delay={i * 90}>
								<p className="docket accent-text">
									{String(i + 1).padStart(2, "0")}
								</p>
								<hr className="stitch-rule mt-3 w-10" aria-hidden />
								<p className="mt-4 font-semibold text-lg">{item.title}</p>
								<p className="ink-soft mt-2 text-sm leading-relaxed">
									{item.body}
								</p>
							</Reveal>
						))}
					</div>
				</MetaRail>
			</Container>
		</section>
	);
}
