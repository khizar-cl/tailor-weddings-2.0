import type {
	PriceUnit,
	VendorProfilePackageSchema,
	VendorProfileServiceSchema,
} from "@repo/shared";
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
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import {
	useAddPackage,
	useRemovePackage,
	useUpdatePackage,
} from "../../api/vendor-profile.api";
import {
	centsToDollars,
	dollarsToCents,
	formatPrice,
	PRICE_UNIT_LABELS,
	PRICE_UNITS,
} from "../vendor/price";

const PackageFormSchema = z.object({
	name: z.string().trim().min(1, "Enter a name").max(120),
	price: z.string().trim().min(1, "Enter a price"),
	priceUnit: z.enum(["flat", "hourly", "per_guest"]),
	description: z.string().trim().min(1, "Enter a description").max(2000),
});

const unitLabels: Record<string, string> = PRICE_UNIT_LABELS;

function PackageForm({
	serviceUuid,
	pkg,
	onDone,
}: {
	serviceUuid: string;
	pkg?: VendorProfilePackageSchema;
	onDone: () => void;
}) {
	const add = useAddPackage();
	const update = useUpdatePackage();
	const isPending = add.isPending || update.isPending;

	const form = useForm({
		defaultValues: {
			name: pkg?.name ?? "",
			price: pkg ? centsToDollars(pkg.priceCents) : "",
			priceUnit: (pkg?.priceUnit ?? "flat") as PriceUnit,
			description: pkg?.description ?? "",
		},
		validators: { onChange: PackageFormSchema },
		onSubmit: ({ value }) => {
			const priceCents = dollarsToCents(value.price);
			if (priceCents === undefined) return;
			const common = {
				name: value.name.trim(),
				description: value.description.trim(),
				priceCents,
				priceUnit: value.priceUnit,
			};
			if (pkg) {
				update.mutate(
					{ packageUuid: pkg.uuid, ...common },
					{ onSuccess: onDone },
				);
			} else {
				add.mutate({ serviceUuid, ...common }, { onSuccess: onDone });
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="flex flex-col gap-4"
		>
			<form.Field
				name="name"
				children={(field) => (
					<div className="form-container">
						<Label htmlFor="pkg-name">Package name</Label>
						<Input
							id="pkg-name"
							placeholder="e.g. Full-day coverage"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			/>
			<div className="form-row">
				<form.Field
					name="price"
					children={(field) => (
						<div className="form-container flex-1">
							<Label htmlFor="pkg-price">Price (USD)</Label>
							<Input
								id="pkg-price"
								type="number"
								min={0}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</div>
					)}
				/>
				<form.Field
					name="priceUnit"
					children={(field) => (
						<div className="form-container flex-1">
							<Label htmlFor="pkg-unit">Unit</Label>
							<Select
								items={unitLabels}
								value={field.state.value}
								onValueChange={(v) => field.handleChange(v as PriceUnit)}
							>
								<SelectTrigger id="pkg-unit" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent alignItemWithTrigger={false}>
									{PRICE_UNITS.map((unit) => (
										<SelectItem key={unit} value={unit}>
											{PRICE_UNIT_LABELS[unit]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				/>
			</div>
			<form.Field
				name="description"
				children={(field) => (
					<div className="form-container">
						<Label htmlFor="pkg-desc">Description</Label>
						<Textarea
							id="pkg-desc"
							rows={2}
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
				<form.Subscribe
					selector={(s) => ({
						canSubmit: s.canSubmit,
						name: s.values.name,
						price: s.values.price,
						description: s.values.description,
					})}
					children={({ canSubmit, name, price, description }) => {
						const incomplete =
							name.trim().length === 0 ||
							price.trim().length === 0 ||
							description.trim().length === 0;
						return (
							<Button
								type="submit"
								disabled={isPending || !canSubmit || incomplete}
							>
								{pkg ? "Save package" : "Add package"}
							</Button>
						);
					}}
				/>
			</div>
		</form>
	);
}

function EditablePackage({ pkg }: { pkg: VendorProfilePackageSchema }) {
	const [editOpen, setEditOpen] = useState(false);
	const [removeOpen, setRemoveOpen] = useState(false);
	const remove = useRemovePackage();

	return (
		<li className="flex items-baseline justify-between gap-4 border-border border-t py-3">
			<div className="min-w-0">
				<p className="text-foreground text-sm">{pkg.name}</p>
				{pkg.description && (
					<p className="mt-0.5 text-muted-foreground text-xs">
						{pkg.description}
					</p>
				)}
			</div>
			<div className="flex shrink-0 items-center gap-1">
				<span className="docket-num mr-2 text-foreground text-sm">
					{formatPrice(pkg.priceCents, pkg.priceUnit)}
				</span>
				<Button
					tone="secondary"
					variant="ghost"
					size="icon-sm"
					aria-label="Edit package"
					onClick={() => setEditOpen(true)}
				>
					<PencilIcon className="size-4" />
				</Button>
				<Button
					tone="destructive"
					variant="ghost"
					size="icon-sm"
					aria-label="Remove package"
					onClick={() => setRemoveOpen(true)}
				>
					<Trash2Icon className="size-4" />
				</Button>

				<Dialog open={editOpen} onOpenChange={setEditOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit package</DialogTitle>
						</DialogHeader>
						<PackageForm
							serviceUuid=""
							pkg={pkg}
							onDone={() => setEditOpen(false)}
						/>
					</DialogContent>
				</Dialog>

				<AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Remove this package?</AlertDialogTitle>
							<AlertDialogDescription>
								Couples will no longer see “{pkg.name}”.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => remove.mutate({ packageUuid: pkg.uuid })}
							>
								Remove
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</li>
	);
}

export function PackageList({
	service,
}: {
	service: VendorProfileServiceSchema;
}) {
	const [addOpen, setAddOpen] = useState(false);

	return (
		<div>
			<div className="flex items-center justify-between">
				<h4 className="docket text-thread-ink">Packages</h4>
				<Button
					tone="secondary"
					variant="outline"
					size="sm"
					onClick={() => setAddOpen(true)}
				>
					<PlusIcon className="size-4" />
					Add package
				</Button>
			</div>
			{service.packages.length === 0 ? (
				<p className="mt-2 text-muted-foreground text-sm">No packages yet.</p>
			) : (
				<ul className="mt-2">
					{service.packages.map((pkg) => (
						<EditablePackage key={pkg.uuid} pkg={pkg} />
					))}
				</ul>
			)}

			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add package</DialogTitle>
					</DialogHeader>
					<PackageForm
						serviceUuid={service.uuid}
						onDone={() => setAddOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
