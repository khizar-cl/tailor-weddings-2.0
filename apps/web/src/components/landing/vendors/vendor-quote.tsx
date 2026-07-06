import { QuoteIcon } from "lucide-react";
import { Container, Media } from "../primitives";
import { Reveal } from "../reveal";

export function VendorQuote() {
	return (
		<section className="sec-forest">
			<Container className="grid items-center gap-10 py-20 md:grid-cols-12 md:gap-14 md:py-28">
				<Reveal className="md:col-span-8">
					<QuoteIcon
						className="size-8 accent-text"
						strokeWidth={1.5}
						aria-hidden
					/>
					<blockquote className="display mt-6 text-2xl leading-snug sm:text-3xl md:text-4xl">
						Half my inquiries used to be tire-kickers. Now the couples who reach
						out already fit how I work, and the florists I team up with can say
						so.
					</blockquote>
					<p className="ink-soft mt-6 text-sm">
						Priya Malhotra, wedding photographer, eight years in
					</p>
				</Reveal>
				<Reveal delay={120} className="md:col-span-4">
					<Media
						keywords="wedding,photographer"
						lock={161}
						alt="A wedding photographer photographing a couple"
						ratioClassName="aspect-[4/5]"
						width={800}
						height={1000}
					/>
				</Reveal>
			</Container>
		</section>
	);
}
