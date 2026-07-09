"use client";

import { Calendar } from "@repo/ui/components/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { cn } from "@repo/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

interface DatePickerProps {
	id?: string;
	value: Date | undefined;
	onChange: (date: Date | undefined) => void;
	placeholder?: string;
	/** Disable days before this date (e.g. today, to block past dates). */
	fromDate?: Date;
}

export function DatePicker({
	id,
	value,
	onChange,
	placeholder = "Pick a date",
	fromDate,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				id={id}
				type="button"
				className={cn(
					"flex h-9 w-full items-center gap-2 rounded-sm border border-input bg-background px-3 text-left text-sm",
					value ? "text-foreground" : "text-muted-foreground",
				)}
			>
				<CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
				{value ? format(value, "PPP") : placeholder}
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto p-0">
				<Calendar
					mode="single"
					selected={value}
					onSelect={(date) => {
						onChange(date);
						setOpen(false);
					}}
					autoFocus
					disabled={fromDate ? { before: fromDate } : undefined}
				/>
			</PopoverContent>
		</Popover>
	);
}
