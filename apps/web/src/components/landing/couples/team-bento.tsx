import { Container, Eyebrow, Media } from "../primitives";
import { Reveal } from "../reveal";

const team = [
	{
		label: "Photography",
		keywords: "wedding,photographer",
		lock: 31,
		alt: "A photographer capturing a couple during their wedding",
		big: true,
	},
	{
		label: "Florals",
		keywords: "wedding,bouquet,flowers",
		lock: 21,
		alt: "A wedding bouquet of fresh flowers",
	},
	{
		label: "Catering",
		keywords: "catering,food",
		lock: 33,
		alt: "Plated food prepared for a wedding reception",
	},
	{
		label: "Venues",
		keywords: "wedding,venue",
		lock: 24,
		alt: "A decorated wedding venue set for a celebration",
	},
	{
		label: "Music",
		keywords: "wedding,dancing",
		lock: 34,
		alt: "Guests dancing at a wedding reception",
	},
];

export function TeamBento() {
	return (
		<section className="hairline sec-surface border-b">
			<Container className="py-20 md:py-28">
				<Eyebrow>Your whole team</Eyebrow>
				<h2 className="display max-w-[18ch] text-3xl sm:text-4xl md:text-5xl">
					Everything your day needs, in one dashboard.
				</h2>
				<div className="mt-10 grid auto-rows-[180px] grid-cols-2 gap-4 md:auto-rows-[210px] md:grid-cols-4">
					{team.map((tile, i) => (
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
