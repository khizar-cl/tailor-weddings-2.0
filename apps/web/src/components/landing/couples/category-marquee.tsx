import { Marquee } from "../primitives";

const categories = [
	"Photography",
	"Videography",
	"Florals",
	"Bridal wear",
	"Planning",
	"Catering",
	"Venues",
	"Music & DJ",
	"Beauty",
	"Invitations",
];

export function CategoryMarquee() {
	return (
		<section
			className="hairline sec-surface border-b py-6"
			aria-label="Vendor categories on Tailor"
		>
			<Marquee items={categories} />
		</section>
	);
}
