import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

type Href = ComponentProps<typeof Link>["href"];

/**
 * The Tailor Weddings brand lockup. On `sm`+ it renders the couture lockup —
 * "Tailor", a marigold running-stitch, then "Weddings" in the mono docket
 * voice; on mobile it collapses to a compact display wordmark. Pass `href` to
 * make it a link (nav/footer/auth); omit it for a static mark (mid-flow, e.g.
 * onboarding).
 */
export function Wordmark({
	href,
	className = "",
}: {
	href?: Href;
	className?: string;
}) {
	const content = (
		<>
			<span className="display text-2xl leading-none tracking-tight">
				Tailor
			</span>
			<span
				className="stitch-rule hidden h-0.5 w-6 shrink-0 sm:block"
				aria-hidden
			/>
			<span className="docket hidden leading-none sm:inline">Weddings</span>
			<span className="display text-2xl leading-none tracking-tight sm:hidden">
				Weddings
			</span>
		</>
	);

	const classes = cn("flex items-center gap-2.5", className);

	if (href !== undefined) {
		return (
			<Link href={href} aria-label="Tailor Weddings home" className={classes}>
				{content}
			</Link>
		);
	}

	return <span className={classes}>{content}</span>;
}
