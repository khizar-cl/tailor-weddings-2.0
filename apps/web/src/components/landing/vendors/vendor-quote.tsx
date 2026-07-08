import vendorQuote from "../../../assets/images/landing/vendor-quote.jpg";
import { Container, Docket, SwatchMedia } from "../primitives";
import { Reveal } from "../reveal";

export function VendorQuote() {
	return (
		<section className="sec-ink">
			<Container className="grid items-center gap-10 py-20 md:grid-cols-12 md:gap-14 md:py-28">
				<Reveal className="md:col-span-8">
					<Docket>From the studio</Docket>
					<hr className="stitch-rule mt-4 w-12" aria-hidden />
					<blockquote className="display mt-6 text-2xl leading-snug sm:text-3xl md:text-4xl">
						Half my inquiries used to be tire-kickers. Now the couples who reach
						out already fit how I work, and the florists I team up with can say
						so.
					</blockquote>
					<p className="docket mt-6">
						Priya Malhotra · wedding photographer · eight years in
					</p>
				</Reveal>
				<Reveal delay={120} className="md:col-span-4">
					<SwatchMedia
						src={vendorQuote}
						alt="A wedding photographer photographing a couple"
						ratioClassName="aspect-[4/5]"
						tag
						zoom={false}
					/>
				</Reveal>
			</Container>
		</section>
	);
}
