"use client";

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@repo/ui/components/combobox";
import { useState } from "react";

interface CreatableComboboxProps {
	items: string[];
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	emptyLabel?: string;
	id?: string;
	"aria-invalid"?: boolean;
}

/**
 * A creatable single-select over string options, composed from the shadcn
 * combobox primitives: filter and pick an existing option, or type a new value
 * and commit it via the "Add …" row. The selected/typed string is the value —
 * the caller decides what a match versus a fresh value means.
 */
export function CreatableCombobox({
	items,
	value,
	onValueChange,
	placeholder,
	emptyLabel = "No matches",
	id,
	...props
}: CreatableComboboxProps) {
	const [query, setQuery] = useState("");
	const trimmed = query.trim();
	const filtered = trimmed
		? items.filter((item) => item.toLowerCase().includes(trimmed.toLowerCase()))
		: items;
	const canCreate =
		trimmed.length > 0 &&
		!items.some((item) => item.toLowerCase() === trimmed.toLowerCase());
	const options = canCreate ? [...filtered, trimmed] : filtered;

	return (
		<Combobox
			items={options}
			value={value || null}
			onValueChange={(next) => onValueChange((next as string | null) ?? "")}
			onInputValueChange={setQuery}
		>
			<ComboboxInput
				id={id}
				placeholder={placeholder}
				aria-invalid={props["aria-invalid"]}
			/>
			<ComboboxContent>
				<ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
				<ComboboxList>
					{(item: string) => (
						<ComboboxItem key={item} value={item}>
							{canCreate && item === trimmed ? `Add “${item}”` : item}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
