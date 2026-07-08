"use client";

import { cn } from "@repo/ui/lib/utils";
import { CheckIcon } from "lucide-react";

export interface ChipOption {
	value: string;
	label: string;
}

interface ChipSelectProps {
	options: ChipOption[];
	selected: string[];
	onToggle: (value: string) => void;
	disabled?: boolean;
	invalid?: boolean;
}

/** Toggle-chip group for single- or multi-select taxonomy (styles, category). */
export function ChipSelect({
	options,
	selected,
	onToggle,
	disabled,
	invalid,
}: ChipSelectProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap gap-2",
				invalid && "rounded-md ring-1 ring-destructive ring-offset-2",
			)}
		>
			{options.map((option) => {
				const isSelected = selected.includes(option.value);
				return (
					<button
						key={option.value}
						type="button"
						disabled={disabled}
						aria-pressed={isSelected}
						onClick={() => onToggle(option.value)}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 text-sm transition disabled:opacity-50",
							isSelected
								? "border-gold bg-gold/12 text-foreground shadow-paper-sm"
								: "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground",
						)}
					>
						{isSelected && <CheckIcon className="size-3.5 text-thread-ink" />}
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

interface PaletteSelectProps {
	colors: string[];
	selected: string[];
	onToggle: (hex: string) => void;
	disabled?: boolean;
}

/** Toggleable color swatches for the wedding palette. */
export function PaletteSelect({
	colors,
	selected,
	onToggle,
	disabled,
}: PaletteSelectProps) {
	return (
		<div className="flex flex-wrap gap-2.5">
			{colors.map((hex) => {
				const isSelected = selected.includes(hex);
				return (
					<button
						key={hex}
						type="button"
						disabled={disabled}
						aria-pressed={isSelected}
						aria-label={hex}
						onClick={() => onToggle(hex)}
						style={{ backgroundColor: hex }}
						className={cn(
							"flex size-10 items-center justify-center rounded-none border border-foreground/10 transition disabled:opacity-50",
							isSelected
								? "ring-2 ring-gold ring-offset-2 ring-offset-background"
								: "hover:-translate-y-0.5",
						)}
					>
						{isSelected && (
							<CheckIcon className="size-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
						)}
					</button>
				);
			})}
		</div>
	);
}
