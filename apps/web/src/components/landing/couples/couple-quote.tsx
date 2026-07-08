import coupleQuote from "../../../assets/images/landing/couple-quote.jpg";
import { Container, Docket, SwatchMedia } from "../primitives";
import { Reveal } from "../reveal";

export function CoupleQuote() {
	return (
		<section className="sec-ink">
			<Container className="grid items-center gap-10 py-20 md:grid-cols-12 md:gap-14 md:py-28">
				<Reveal className="md:col-span-8">
					<Docket>Fitted by trust</Docket>
					<hr className="stitch-rule mt-4 w-12" aria-hidden />
					<blockquote className="display mt-6 text-2xl leading-snug sm:text-3xl md:text-4xl">
						We found our photographer through a florist who had worked with her
						twice. That kind of trust is why we stopped second-guessing every
						choice.
					</blockquote>
					<p className="docket mt-6">Maya &amp; Daniel · married last spring</p>
				</Reveal>
				<Reveal delay={120} className="md:col-span-4">
					<SwatchMedia
						src={coupleQuote}
						alt="A married couple portrait taken by their photographer"
						ratioClassName="aspect-[4/5]"
						tag
						zoom={false}
					/>
				</Reveal>
			</Container>
		</section>
	);
}
