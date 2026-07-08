import { Badge } from "@repo/ui/components/badge";
import { Container } from "../primitives";

const specialties = [
	"Photography",
	"Videography",
	"Florals",
	"Planning",
	"Catering",
	"Venues",
	"Music & DJ",
	"Beauty",
];

export function SpecialtyRow() {
	return (
		<section
			className="hairline sec-surface border-b"
			aria-label="Specialties on Tailor"
		>
			<Container className="flex flex-wrap items-center gap-3 py-8">
				<span className="docket mr-2">Every discipline couples book</span>
				{specialties.map((item) => (
					<Badge
						key={item}
						tone="primary"
						variant="outline"
						className="px-3 py-1 text-sm"
					>
						{item}
					</Badge>
				))}
			</Container>
		</section>
	);
}
