import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { ChecklistItem } from "../checklist/buckets";
import { TaskRow } from "../checklist/task-row";
import { PanelHeader } from "./panel-header";
import { ProgressBar } from "./progress-bar";

const DASHBOARD_TASK_PREVIEW = 7;

export function ChecklistPreview({
	items,
	onToggleTask,
}: {
	items: ChecklistItem[];
	onToggleTask: (uuid: string, isComplete: boolean) => void;
}) {
	const total = items.length;
	const done = items.filter((item) => item.isComplete).length;
	const remaining = total - done;
	const pct = total > 0 ? Math.round((done / total) * 100) : 0;
	const preview = items.slice(0, DASHBOARD_TASK_PREVIEW);

	return (
		<section>
			<PanelHeader
				title="Your checklist"
				trailing={
					<span className="docket-num text-muted-foreground text-sm">
						{done} / {total} done
					</span>
				}
			/>
			<div className="mt-4">
				<ProgressBar pct={pct} />
			</div>

			{total === 0 ? (
				<p className="docket mt-6">Your checklist is being tailored.</p>
			) : (
				<ul className="mt-6">
					{preview.map((item) => (
						<TaskRow key={item.uuid} item={item} onToggle={onToggleTask} />
					))}
				</ul>
			)}

			<Link
				href="/portal/checklist"
				className="mt-4 inline-flex items-center gap-1 text-primary text-sm hover:underline"
			>
				Open checklist
				{remaining > 0 && ` · ${remaining} to do`}
				<ArrowRightIcon className="size-3.5" />
			</Link>
		</section>
	);
}
