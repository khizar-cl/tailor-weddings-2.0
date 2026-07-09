import type { ChecklistItem } from "./buckets";
import { groupByBucket } from "./buckets";
import { TaskRow } from "./task-row";

interface ChecklistBoardProps {
	items: ChecklistItem[];
	onToggle: (uuid: string, isComplete: boolean) => void;
	onRemove: (uuid: string) => void;
}

export function ChecklistBoard({
	items,
	onToggle,
	onRemove,
}: ChecklistBoardProps) {
	if (items.length === 0) {
		return <p className="docket">No tasks yet — add your first one.</p>;
	}

	const groups = groupByBucket(items);

	return (
		<div className="flex flex-col gap-8">
			{groups.map((group) => (
				<section key={group.bucket}>
					<div className="docket text-thread-ink">{group.bucket}</div>
					<ul className="mt-2">
						{group.items.map((item) => (
							<TaskRow
								key={item.uuid}
								item={item}
								onToggle={onToggle}
								onRemove={onRemove}
							/>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}
