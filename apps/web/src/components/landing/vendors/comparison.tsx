import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { CheckIcon, XIcon } from "lucide-react";
import { Container } from "../primitives";
import { Reveal } from "../reveal";

const oldWay = [
	"Pay for volume, then sift through the spam",
	"Anonymous reviews you cannot verify",
	"A race to the bottom on price",
];

const tailorWay = [
	"Fewer introductions, matched to your work",
	"Peer reviews tied to real events",
	"Your pricing, in the open, on your terms",
];

export function Comparison() {
	return (
		<section className="hairline border-b">
			<Container className="py-20 md:py-28">
				<Reveal>
					<p className="eyebrow mb-4">Made-to-measure vs. off-the-rack</p>
					<h2 className="display max-w-[18ch] text-3xl sm:text-4xl md:text-5xl">
						Two ways to find your next{" "}
						<span className="accent-text">booking.</span>
					</h2>
				</Reveal>
				<div className="mt-10 grid gap-6 md:grid-cols-2">
					<Reveal>
						<Card className="h-full bg-muted">
							<CardHeader>
								<CardTitle className="text-lg">The usual directory</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="m-0 grid list-none gap-4 p-0">
									{oldWay.map((item) => (
										<li key={item} className="flex items-start gap-3">
											<XIcon
												className="mt-0.5 size-5 shrink-0 text-muted-foreground"
												strokeWidth={2}
												aria-hidden
											/>
											<span className="ink-soft">{item}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					</Reveal>
					<Reveal delay={120}>
						<Card className="h-full border-transparent bg-emphasis text-emphasis-foreground">
							<CardHeader>
								<CardTitle className="text-lg">With Tailor</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="m-0 grid list-none gap-4 p-0">
									{tailorWay.map((item) => (
										<li key={item} className="flex items-start gap-3">
											<CheckIcon
												className="mt-0.5 size-5 shrink-0 text-gold"
												strokeWidth={2.5}
												aria-hidden
											/>
											<span>{item}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					</Reveal>
				</div>
			</Container>
		</section>
	);
}
