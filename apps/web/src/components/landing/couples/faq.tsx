import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@repo/ui/components/accordion";
import { Container } from "../primitives";

const faqs = [
	{
		q: "Is Tailor free while we plan?",
		a: "Yes. The planning tools, your team dashboard, and vendor matches are free for couples.",
	},
	{
		q: "How are the reviews different here?",
		a: "Every review is tied to a real event. Vendors review the professionals they worked with, so reputations are built by peers, not anonymous ratings.",
	},
	{
		q: "Do we have to book the vendors you suggest?",
		a: "No. Matches are a starting point. Save anyone you like to your team and plan around them.",
	},
	{
		q: "Can my partner help plan?",
		a: "Yes. Invite your partner to share the same dashboard, checklist, and budget.",
	},
];

export function Faq() {
	return (
		<section className="hairline border-b">
			<Container className="grid gap-10 py-20 md:grid-cols-12 md:py-28">
				<div className="md:col-span-4">
					<p className="eyebrow mb-4">Fitting notes</p>
					<h2 className="display text-3xl sm:text-4xl md:text-5xl">
						Questions couples ask.
					</h2>
				</div>
				<div className="md:col-span-8 md:col-start-5">
					<Accordion multiple={false}>
						{faqs.map((item) => (
							<AccordionItem key={item.q} value={item.q}>
								<AccordionTrigger className="py-5 text-lg">
									{item.q}
								</AccordionTrigger>
								<AccordionContent className="ink-soft max-w-2xl text-base leading-relaxed">
									{item.a}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</Container>
		</section>
	);
}
