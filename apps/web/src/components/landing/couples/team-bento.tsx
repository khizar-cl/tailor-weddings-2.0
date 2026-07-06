import teamCatering from "../../../assets/images/landing/team-catering.jpg";
import teamFlorals from "../../../assets/images/landing/team-florals.jpg";
import teamMusic from "../../../assets/images/landing/team-music.jpg";
import teamPhotographer from "../../../assets/images/landing/team-photographer.jpg";
import teamVenue from "../../../assets/images/landing/team-venue.jpg";
import { Container, Eyebrow, Media } from "../primitives";
import { Reveal } from "../reveal";

const team = [
	{
		label: "Photography",
		src: teamPhotographer,
		alt: "A photographer capturing a couple during their wedding",
		big: true,
	},
	{
		label: "Florals",
		src: teamCatering,
		alt: "A wedding bouquet of fresh flowers",
	},
	{
		label: "Catering",
		src: teamFlorals,
		alt: "Plated food prepared for a wedding reception",
	},
	{
		label: "Venues",
		src: teamVenue,
		alt: "A decorated wedding venue set for a celebration",
	},
	{
		label: "Music",
		src: teamMusic,
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
							<Media src={tile.src} alt={tile.alt} className="flex-1" zoom />
							<p className="font-semibold text-sm">{tile.label}</p>
						</Reveal>
					))}
				</div>
			</Container>
		</section>
	);
}
