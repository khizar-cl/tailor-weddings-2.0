"use client";

import type { AddChecklistTaskInputSchema, CategoryItem } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { PlusIcon } from "lucide-react";
import { z } from "zod";
import { DatePicker } from "../date-picker";

const AddTaskFormSchema = z.object({
	title: z.string().trim().min(1, "Enter a task").max(200),
	description: z.string().trim().max(1000),
	categoryUuid: z.string(),
	// Union (not .optional()) keeps the key required so the type matches the
	// form's default values, while still accepting an unset date.
	dueDate: z.union([z.date(), z.undefined()]),
});

interface AddTaskFormProps {
	categories: CategoryItem[];
	onAdd: (input: AddChecklistTaskInputSchema) => void;
	isPending: boolean;
}

export function AddTaskForm({
	categories,
	onAdd,
	isPending,
}: AddTaskFormProps) {
	// Maps each value to its label so <SelectValue /> shows the name, not the uuid.
	const categoryLabels: Record<string, string> = {
		"": "No category",
		...Object.fromEntries(categories.map((c) => [c.uuid, c.name])),
	};

	const form = useForm({
		defaultValues: {
			title: "",
			description: "",
			categoryUuid: "",
			dueDate: undefined as Date | undefined,
		},
		validators: { onChange: AddTaskFormSchema },
		onSubmit: ({ value }) => {
			onAdd({
				title: value.title.trim(),
				description: value.description.trim() || undefined,
				categoryUuid: value.categoryUuid || undefined,
				dueDate: value.dueDate,
			});
			form.reset();
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="flex flex-col gap-4"
		>
			<form.Field
				name="title"
				children={(field) => (
					<div className="form-container">
						<Label htmlFor="task-title">Task</Label>
						<Input
							id="task-title"
							placeholder="e.g. Book a florist"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							aria-invalid={
								field.state.meta.isTouched && field.state.meta.errors.length > 0
							}
						/>
						{field.state.meta.isTouched &&
							field.state.meta.errors.length > 0 && (
								<p className="invalid-input">
									{field.state.meta.errors[0]?.message}
								</p>
							)}
					</div>
				)}
			/>

			<form.Field
				name="categoryUuid"
				children={(field) => (
					<div className="form-container">
						<Label htmlFor="task-category">
							Category <span className="text-muted-foreground">(optional)</span>
						</Label>
						<Select
							items={categoryLabels}
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value as string)}
						>
							<SelectTrigger id="task-category" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent alignItemWithTrigger={false}>
								<SelectItem value="">No category</SelectItem>
								{categories.map((category) => (
									<SelectItem key={category.uuid} value={category.uuid}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			/>

			<form.Field
				name="dueDate"
				children={(field) => (
					<div className="form-container">
						<Label htmlFor="task-due">
							Due date <span className="text-muted-foreground">(optional)</span>
						</Label>
						<DatePicker
							id="task-due"
							value={field.state.value}
							onChange={(date) => field.handleChange(date)}
							fromDate={new Date()}
						/>
					</div>
				)}
			/>

			<form.Field
				name="description"
				children={(field) => (
					<div className="form-container">
						<Label htmlFor="task-notes">
							Notes <span className="text-muted-foreground">(optional)</span>
						</Label>
						<Textarea
							id="task-notes"
							rows={2}
							maxLength={1000}
							placeholder="Any details to remember…"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							aria-invalid={
								field.state.meta.isTouched && field.state.meta.errors.length > 0
							}
						/>
						{field.state.meta.isTouched &&
							field.state.meta.errors.length > 0 && (
								<p className="invalid-input">
									{field.state.meta.errors[0]?.message}
								</p>
							)}
					</div>
				)}
			/>

			<form.Subscribe
				selector={(state) => ({
					canSubmit: state.canSubmit,
					title: state.values.title,
				})}
				children={({ canSubmit, title }) => (
					<Button
						type="submit"
						disabled={isPending || !canSubmit || title.trim().length === 0}
						className="w-full"
					>
						<PlusIcon className="size-4" />
						Add task
					</Button>
				)}
			/>
		</form>
	);
}
