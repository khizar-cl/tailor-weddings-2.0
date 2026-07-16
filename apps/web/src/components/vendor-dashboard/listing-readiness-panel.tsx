import { cn } from "@repo/ui/lib/utils";
import { CheckIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { PanelHeader } from "../dashboard/panel-header";
import { ProgressBar } from "../dashboard/progress-bar";

export interface ReadinessStep {
	label: string;
	done: boolean;
	href: Route;
}

export function ListingReadinessPanel({ steps }: { steps: ReadinessStep[] }) {
	const doneCount = steps.filter((step) => step.done).length;
	const pct = Math.round((doneCount / steps.length) * 100);

	return (
		<section>
			<PanelHeader
				title="Your listing"
				trailing={
					<span className="docket-num text-foreground text-sm">
						{pct}% ready
					</span>
				}
			/>
			<div className="mt-4">
				<ProgressBar pct={pct} />
			</div>
			<ul className="mt-4">
				{steps.map((step) => (
					<li key={step.label} className="border-border border-b last:border-0">
						<Link
							href={step.href}
							className="group flex items-center gap-3 py-3"
						>
							<span
								className={cn(
									"flex size-5 shrink-0 items-center justify-center border",
									step.done
										? "border-thread-ink text-thread-ink"
										: "border-border",
								)}
							>
								{step.done && <CheckIcon className="size-3" strokeWidth={2} />}
							</span>
							<span
								className={cn(
									"text-sm",
									step.done
										? "text-muted-foreground line-through"
										: "text-foreground group-hover:underline",
								)}
							>
								{step.label}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
