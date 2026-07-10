import type { CategoryItem } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
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
import { useState } from "react";
import { z } from "zod";
import { useAddService } from "../../api/vendor-profile.api";

const CUSTOM = "__custom__";

const AddServiceSchema = z
	.object({
		selection: z.string().min(1, "Choose a service"),
		customLabel: z.string().trim().max(120),
		description: z.string().trim().min(1, "Enter a description").max(2000),
	})
	.refine((v) => v.selection !== CUSTOM || v.customLabel.trim().length > 0, {
		message: "Enter a name",
		path: ["customLabel"],
	});

export function AddServiceForm({
	availableCategories,
	canAdd,
	maxServices,
}: {
	availableCategories: CategoryItem[];
	canAdd: boolean;
	maxServices: number;
}) {
	const [open, setOpen] = useState(false);
	const addService = useAddService();

	const selectItems: Record<string, string> = {
		...Object.fromEntries(availableCategories.map((c) => [c.uuid, c.name])),
		[CUSTOM]: "Something else (custom)",
	};

	const form = useForm({
		defaultValues: {
			selection: "",
			customLabel: "",
			description: "",
		},
		validators: { onChange: AddServiceSchema },
		onSubmit: ({ value }) => {
			const input =
				value.selection === CUSTOM
					? {
							customLabel: value.customLabel.trim(),
							description: value.description.trim(),
						}
					: {
							categoryUuid: value.selection,
							description: value.description.trim(),
						};
			addService.mutate(input, {
				onSuccess: () => {
					form.reset();
					setOpen(false);
				},
			});
		},
	});

	if (!canAdd) {
		return (
			<p className="text-muted-foreground text-sm">
				Your plan includes {maxServices} service{maxServices === 1 ? "" : "s"}.
				Upgrade your membership to offer more.
			</p>
		);
	}

	return (
		<>
			<Button tone="secondary" variant="outline" onClick={() => setOpen(true)}>
				<PlusIcon className="size-4" />
				Add a service
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add a service</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="flex flex-col gap-4"
					>
						<form.Field
							name="selection"
							children={(field) => (
								<div className="form-container">
									<Label htmlFor="svc-category">Service</Label>
									<Select
										items={selectItems}
										value={field.state.value}
										onValueChange={(v) => field.handleChange(v as string)}
									>
										<SelectTrigger id="svc-category" className="w-full">
											<SelectValue placeholder="Choose a category" />
										</SelectTrigger>
										<SelectContent alignItemWithTrigger={false}>
											{availableCategories.map((category) => (
												<SelectItem key={category.uuid} value={category.uuid}>
													{category.name}
												</SelectItem>
											))}
											<SelectItem value={CUSTOM}>
												Something else (custom)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						/>

						<form.Subscribe
							selector={(s) => s.values.selection}
							children={(selection) =>
								selection === CUSTOM ? (
									<form.Field
										name="customLabel"
										children={(field) => (
											<div className="form-container">
												<Label htmlFor="svc-custom">Service name</Label>
												<Input
													id="svc-custom"
													placeholder="e.g. Balloon artistry"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
												/>
												<p className="help-text">
													Custom services stay private until our team approves
													them into a category.
												</p>
											</div>
										)}
									/>
								) : null
							}
						/>

						<form.Field
							name="description"
							children={(field) => (
								<div className="form-container">
									<Label htmlFor="svc-desc">Description</Label>
									<Textarea
										id="svc-desc"
										rows={3}
										placeholder="What you offer and what makes it yours."
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0
										}
									/>
									<p className="help-text">
										Prices come from the packages you add to this service.
									</p>
								</div>
							)}
						/>

						<div className="form-actions">
							<form.Subscribe
								selector={(s) => ({
									canSubmit: s.canSubmit,
									selection: s.values.selection,
									customLabel: s.values.customLabel,
									description: s.values.description,
								})}
								children={({
									canSubmit,
									selection,
									customLabel,
									description,
								}) => {
									const incomplete =
										selection.length === 0 ||
										description.trim().length === 0 ||
										(selection === CUSTOM && customLabel.trim().length === 0);
									return (
										<Button
											type="submit"
											disabled={
												addService.isPending || !canSubmit || incomplete
											}
										>
											Add service
										</Button>
									);
								}}
							/>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
