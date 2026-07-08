import offeringsCake from "../../../assets/images/landing/offerings-cake.jpg";
import offeringsCouple from "../../../assets/images/landing/offerings-couple.jpg";
import offeringsPhotographer from "../../../assets/images/landing/offerings-photographer.jpg";
import offeringsPortrait from "../../../assets/images/landing/offerings-portrait.jpg";
import offeringsReception from "../../../assets/images/landing/offerings-reception.jpg";
import { Container, Eyebrow, SwatchMedia } from "../primitives";
import { Reveal } from "../reveal";

const offerings = [
	{
		label: "Portfolio",
		src: offeringsPortrait,
		alt: "A wedding portrait from a photographer's portfolio",
		big: true,
	},
	{
		label: "Service packages",
		src: offeringsCake,
		alt: "A wedding cake, the kind of service a vendor can package and price",
	},
	{
		label: "Peer reviews",
		src: offeringsPhotographer,
		alt: "A wedding photographer at work, the kind of peer who reviews vendors",
	},
	{
		label: "Couple matches",
		src: offeringsCouple,
		alt: "A couple whose style and budget suit a vendor's work",
	},
	{
		label: "Bookings",
		src: offeringsReception,
		alt: "A booked wedding reception styled by a vendor",
	},
];

export function OfferingsBento() {
	return (
		<section className="hairline sec-surface border-b">
			<Container className="py-20 md:py-28">
				<Eyebrow>What you get</Eyebrow>
				<h2 className="display max-w-[18ch] text-3xl sm:text-4xl md:text-5xl">
					One profile that does the selling for you.
				</h2>
				<div className="mt-10 grid auto-rows-[180px] grid-cols-2 gap-4 md:auto-rows-[210px] md:grid-cols-4">
					{offerings.map((tile, i) => (
						<Reveal
							key={tile.label}
							delay={i * 70}
							className={
								tile.big
									? "col-span-2 row-span-2 flex flex-col gap-2"
									: "flex flex-col gap-2"
							}
						>
							<SwatchMedia
								src={tile.src}
								alt={tile.alt}
								className="flex-1"
								tag={tile.big}
							/>
							<p className="docket">{tile.label}</p>
						</Reveal>
					))}
				</div>
			</Container>
		</section>
	);
}
