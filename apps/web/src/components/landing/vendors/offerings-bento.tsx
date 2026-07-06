import { Container, Eyebrow, Media } from "../primitives";
import { Reveal } from "../reveal";

const offerings = [
	{
		label: "Portfolio",
		keywords: "wedding,portrait",
		lock: 171,
		alt: "A wedding portrait from a photographer's portfolio",
		big: true,
	},
	{
		label: "Service packages",
		keywords: "wedding,cake",
		lock: 27,
		alt: "A wedding cake, the kind of service a vendor can package and price",
	},
	{
		label: "Peer reviews",
		keywords: "wedding,photographer",
		lock: 201,
		alt: "A wedding photographer at work, the kind of peer who reviews vendors",
	},
	{
		label: "Couple matches",
		keywords: "wedding,couple",
		lock: 51,
		alt: "A couple whose style and budget suit a vendor's work",
	},
	{
		label: "Bookings",
		keywords: "wedding,reception,table",
		lock: 122,
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
							<Media
								keywords={tile.keywords}
								lock={tile.lock}
								alt={tile.alt}
								className="flex-1"
								zoom
							/>
							<p className="font-semibold text-sm">{tile.label}</p>
						</Reveal>
					))}
				</div>
			</Container>
		</section>
	);
}
