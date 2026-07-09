import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { cn } from "@repo/ui/lib/utils";
import { format } from "date-fns";
import { CheckIcon, XIcon } from "lucide-react";
import type { ChecklistItem } from "./buckets";

interface TaskRowProps {
	item: ChecklistItem;
	onToggle: (uuid: string, isComplete: boolean) => void;
	onRemove?: (uuid: string) => void;
}

export function TaskRow({ item, onToggle, onRemove }: TaskRowProps) {
	return (
		<li className="flex items-start gap-3 border-border border-b py-3 last:border-0">
			<button
				type="button"
				aria-pressed={item.isComplete}
				aria-label={
					item.isComplete
						? `Mark "${item.title}" not done`
						: `Mark "${item.title}" done`
				}
				onClick={() => onToggle(item.uuid, !item.isComplete)}
				className={cn(
					"mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border",
					item.isComplete
						? "border-primary bg-primary text-primary-foreground"
						: "border-input hover:border-primary",
				)}
			>
				{item.isComplete && <CheckIcon className="size-3" />}
			</button>
			<div className="flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
				<span
					className={cn(
						"text-sm",
						item.isComplete
							? "text-muted-foreground line-through"
							: "text-foreground",
					)}
				>
					{item.title}
				</span>
				{item.category && <span className="docket">{item.category.name}</span>}
				{item.dueDate && (
					<span className="docket">{format(item.dueDate, "MMM yyyy")}</span>
				)}
			</div>
			{onRemove && (
				<AlertDialog>
					<AlertDialogTrigger
						aria-label={`Remove "${item.title}"`}
						className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive-foreground"
					>
						<XIcon className="size-4" />
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Remove this task?</AlertDialogTitle>
							<AlertDialogDescription>
								"{item.title}" will be removed from your checklist. You can't
								undo this.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={() => onRemove(item.uuid)}>
								Remove
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</li>
	);
}
