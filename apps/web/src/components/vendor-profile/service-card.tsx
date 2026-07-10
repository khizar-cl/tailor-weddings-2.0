import type { VendorProfileServiceSchema } from "@repo/shared";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import {
	PencilIcon,
	StarIcon,
	Trash2Icon,
	TriangleAlertIcon,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import {
	useRemoveService,
	useSetServicePrimary,
	useSetServicePublish,
	useUpdateService,
} from "../../api/vendor-profile.api";
import { formatPrice } from "../vendor/price";
import { PackageList } from "./package-list";
import { PortfolioManager } from "./portfolio-manager";

const ServiceFormSchema = z.object({
	customLabel: z.string().trim().max(120),
	description: z.string().trim().min(1, "Enter a description").max(2000),
});

function ServiceDetailsForm({
	service,
	onSaved,
	onCancel,
}: {
	service: VendorProfileServiceSchema;
	onSaved: () => void;
	onCancel: () => void;
}) {
	const update = useUpdateService();

	const form = useForm({
		defaultValues: {
			customLabel: service.customLabel ?? "",
			description: service.description ?? "",
		},
		validators: { onChange: ServiceFormSchema },
		onSubmit: ({ value }) => {
			update.mutate(
				{
					serviceUuid: service.uuid,
					customLabel:
						service.isPending && value.customLabel.trim()
							? value.customLabel.trim()
							: undefined,
					description: value.description.trim(),
				},
				{ onSuccess: onSaved },
			);
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="mt-3 flex flex-col gap-4"
		>
			{service.isPending && (
				<form.Field
					name="customLabel"
					children={(field) => (
						<div className="form-container">
							<Label htmlFor={`svc-label-${service.uuid}`}>Service name</Label>
							<Input
								id={`svc-label-${service.uuid}`}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</div>
					)}
				/>
			)}
			<form.Field
				name="description"
				children={(field) => (
					<div className="form-container">
						<Label htmlFor={`svc-desc-${service.uuid}`}>Description</Label>
						<Textarea
							id={`svc-desc-${service.uuid}`}
							rows={3}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							aria-invalid={
								field.state.meta.isTouched && field.state.meta.errors.length > 0
							}
						/>
					</div>
				)}
			/>
			<div className="form-actions">
				<Button
					type="button"
					tone="secondary"
					variant="ghost"
					onClick={onCancel}
				>
					Cancel
				</Button>
				<form.Subscribe
					selector={(s) => s.canSubmit}
					children={(canSubmit) => (
						<Button type="submit" disabled={update.isPending || !canSubmit}>
							Save
						</Button>
					)}
				/>
			</div>
		</form>
	);
}

export function ServiceCard({
	service,
	hasLogo,
	maxPortfolioImages,
}: {
	service: VendorProfileServiceSchema;
	hasLogo: boolean;
	maxPortfolioImages: number;
}) {
	const [removeOpen, setRemoveOpen] = useState(false);
	const [editing, setEditing] = useState(false);
	const setPublish = useSetServicePublish();
	const setPrimary = useSetServicePrimary();
	const remove = useRemoveService();

	// Publishing needs a taxonomy category and a business logo.
	const canPublish = !service.isPending && hasLogo;

	const draftMessage = service.isPending
		? "Pending review — custom services can't be published until approved into a category."
		: !hasLogo
			? "Draft — add a business logo above, then publish to appear in discovery."
			: "Draft — not visible to couples yet. Toggle Publish to go live.";

	return (
		<section className="overflow-hidden border border-border">
			{!service.isPublished && (
				<div className="flex items-center gap-2 border-border border-b bg-warning px-5 py-2.5 text-warning-foreground text-xs">
					<TriangleAlertIcon className="size-4 shrink-0" strokeWidth={1.75} />
					<span>{draftMessage}</span>
				</div>
			)}

			<div className="p-5">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
							<h3 className="font-serif text-foreground text-lg">
								{service.displayName}
							</h3>
							{service.isPrimary ? (
								<Badge tone="info" variant="outline" className="gap-1">
									<StarIcon
										className="size-3.5 fill-current"
										strokeWidth={1.75}
									/>
									Primary
								</Badge>
							) : (
								<Button
									tone="secondary"
									variant="outline"
									size="sm"
									disabled={setPrimary.isPending}
									onClick={() =>
										setPrimary.mutate({ serviceUuid: service.uuid })
									}
								>
									<StarIcon className="size-4" strokeWidth={1.75} />
									Set as primary
								</Button>
							)}
						</div>
						<p className="docket mt-1 text-muted-foreground">
							{service.startingPriceCents !== null ? (
								<>
									from{" "}
									<span className="docket-num text-foreground">
										{formatPrice(service.startingPriceCents, service.priceUnit)}
									</span>
								</>
							) : (
								"No packages yet — add one to set a price"
							)}
						</p>
					</div>

					<div className="flex items-center gap-4">
						<span className="flex items-center gap-2">
							<span className="docket text-muted-foreground">
								{service.isPublished ? "Published" : "Draft"}
							</span>
							<Switch
								checked={service.isPublished}
								disabled={
									setPublish.isPending || (!service.isPublished && !canPublish)
								}
								aria-label={service.isPublished ? "Unpublish" : "Publish"}
								onCheckedChange={(checked) =>
									setPublish.mutate({
										serviceUuid: service.uuid,
										isPublished: checked,
									})
								}
							/>
						</span>
						<Button
							tone="destructive"
							variant="ghost"
							size="icon-sm"
							aria-label="Remove service"
							onClick={() => setRemoveOpen(true)}
						>
							<Trash2Icon className="size-4" />
						</Button>
					</div>
				</div>

				<div className="mt-5">
					<div className="flex items-start justify-between gap-3">
						<span className="docket text-thread-ink">Description</span>
						{!editing && (
							<Button
								tone="secondary"
								variant="ghost"
								size="icon-xs"
								aria-label="Edit description"
								onClick={() => setEditing(true)}
							>
								<PencilIcon className="size-4" />
							</Button>
						)}
					</div>
					{editing ? (
						<ServiceDetailsForm
							service={service}
							onSaved={() => setEditing(false)}
							onCancel={() => setEditing(false)}
						/>
					) : service.description ? (
						<p className="mt-1 whitespace-pre-line text-foreground text-sm leading-relaxed">
							{service.description}
						</p>
					) : (
						<p className="mt-1 text-muted-foreground text-sm italic">
							Add a description so couples know what you offer.
						</p>
					)}
				</div>

				<hr className="my-5 border-border border-t" />
				<PackageList service={service} />

				<hr className="my-5 border-border border-t" />
				<PortfolioManager service={service} maxImages={maxPortfolioImages} />
			</div>

			<AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove this service?</AlertDialogTitle>
						<AlertDialogDescription>
							“{service.displayName}”, along with its packages and portfolio,
							will be removed from your listing.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => remove.mutate({ serviceUuid: service.uuid })}
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
