import type { ChecklistListSchema } from "@repo/shared";
import { differenceInCalendarDays } from "date-fns";

export type ChecklistItem = ChecklistListSchema["items"][number];

export const BUCKET_ORDER = [
	"Start now",
	"This month",
	"Next 3 months",
	"Later",
] as const;
export type Bucket = (typeof BUCKET_ORDER)[number];

export function bucketOf(dueDate: Date | null): Bucket {
	if (!dueDate) return "Start now";
	const days = differenceInCalendarDays(dueDate, new Date());
	if (days < 0) return "Start now";
	if (days <= 31) return "This month";
	if (days <= 92) return "Next 3 months";
	return "Later";
}

export function groupByBucket(items: ChecklistItem[]) {
	const groups = new Map<Bucket, ChecklistItem[]>();
	for (const item of items) {
		const bucket = bucketOf(item.dueDate);
		const list = groups.get(bucket) ?? [];
		list.push(item);
		groups.set(bucket, list);
	}
	return BUCKET_ORDER.map((bucket) => ({
		bucket,
		items: groups.get(bucket) ?? [],
	})).filter((group) => group.items.length > 0);
}
