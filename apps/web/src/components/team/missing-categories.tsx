import type { WeddingTeamCategoryGapSchema } from "@repo/shared";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export function MissingCategories({
	categories,
}: {
	categories: WeddingTeamCategoryGapSchema[];
}) {
	if (categories.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				Every category has someone on your team.
			</p>
		);
	}

	return (
		<ul className="flex flex-col">
			{categories.map((category) => (
				<li key={category.uuid}>
					<Link
						href={`/portal/discover?category=${category.uuid}`}
						className="group flex items-center justify-between border-border border-b py-2.5 last:border-0"
					>
						<span className="text-foreground text-sm">{category.name}</span>
						<span className="docket flex items-center gap-1 text-thread-ink group-hover:text-primary">
							Find
							<ArrowRightIcon className="size-3.5" strokeWidth={1.75} />
						</span>
					</Link>
				</li>
			))}
		</ul>
	);
}
