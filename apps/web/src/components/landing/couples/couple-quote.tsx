import { CalendarHeartIcon } from "lucide-react";
import { Container, Media } from "../primitives";
import { Reveal } from "../reveal";

export function CoupleQuote() {
	return (
		<section className="sec-forest">
			<Container className="grid items-center gap-10 py-20 md:grid-cols-12 md:gap-14 md:py-28">
				<Reveal className="md:col-span-8">
					<CalendarHeartIcon
						className="size-8 accent-text"
						strokeWidth={1.5}
						aria-hidden
					/>
					<blockquote className="display mt-6 text-2xl leading-snug sm:text-3xl md:text-4xl">
						We found our photographer through a florist who had worked with her
						twice. That kind of trust is why we stopped second-guessing every
						choice.
					</blockquote>
					<p className="ink-soft mt-6 text-sm">
						Maya and Daniel, married last spring
					</p>
				</Reveal>
				<Reveal delay={120} className="md:col-span-4">
					<Media
						keywords="wedding,portrait"
						lock={71}
						alt="A married couple portrait taken by their photographer"
						ratioClassName="aspect-[4/5]"
						width={800}
						height={1000}
					/>
				</Reveal>
			</Container>
		</section>
	);
}
