import { ImageIcon, StarIcon, TagIcon } from "lucide-react";
import peerReviewVenue from "../../../assets/images/landing/peer-review-venue.jpg";
import { Container, LinkCta, SwatchMedia } from "../primitives";
import { Reveal } from "../reveal";

const signUp = { pathname: "/sign-up/" as const, query: { intent: "vendor" } };

const reviewPoints = [
	{ icon: StarIcon, text: "Verified against a real event" },
	{ icon: ImageIcon, text: "Shown beside your portfolio" },
	{ icon: TagIcon, text: "From the pros who were there" },
];

export function PeerReviewFeature() {
	return (
		<section className="hairline border-b">
			<Container className="grid items-center gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28">
				<Reveal>
					<p className="eyebrow mb-4">Cut from real events</p>
					<h2 className="display max-w-[14ch] text-3xl sm:text-4xl md:text-5xl">
						Reviews you cannot buy.
					</h2>
					<p className="ink-soft mt-5 max-w-md text-lg leading-relaxed">
						After an event, Tailor asks the vendors on the same wedding to
						review each other. Each one is verified against a real booking, so
						your profile carries proof, not marketing.
					</p>
					<ul className="m-0 mt-7 grid list-none gap-3 p-0">
						{reviewPoints.map(({ icon: Icon, text }) => (
							<li key={text} className="flex items-center gap-3">
								<Icon
									className="size-5 shrink-0 accent-text"
									strokeWidth={1.75}
									aria-hidden
								/>
								<span>{text}</span>
							</li>
						))}
					</ul>
					<div className="mt-8">
						<LinkCta href={signUp}>List your business</LinkCta>
					</div>
				</Reveal>
				<Reveal delay={120}>
					<SwatchMedia
						src={peerReviewVenue}
						alt="A wedding venue set up by a team of vendors"
						ratioClassName="aspect-[5/4]"
						tag
					/>
				</Reveal>
			</Container>
		</section>
	);
}
