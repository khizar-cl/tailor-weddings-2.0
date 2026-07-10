import type { VendorProfileSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useUpdateBusiness } from "../../api/vendor-profile.api";

const BusinessFormSchema = z.object({
	businessName: z.string().trim().min(1, "Enter a business name").max(200),
	region: z.string().trim().min(1, "Enter a region").max(120),
	city: z.string().trim().max(120),
	tagline: z.string().trim().max(200),
	website: z.string().trim().max(300),
	yearsInBusiness: z.string().trim(),
	bio: z.string().trim().max(4000),
});

function Field({
	label,
	htmlFor,
	optional,
	children,
	error,
}: {
	label: string;
	htmlFor: string;
	optional?: boolean;
	children: React.ReactNode;
	error?: string;
}) {
	return (
		<div className="form-container">
			<Label htmlFor={htmlFor}>
				{label}
				{optional && <span className="text-muted-foreground"> (optional)</span>}
			</Label>
			{children}
			{error && <p className="invalid-input">{error}</p>}
		</div>
	);
}

export function BusinessDetailsForm({
	profile,
	onSaved,
	onCancel,
}: {
	profile: VendorProfileSchema;
	onSaved?: () => void;
	onCancel?: () => void;
}) {
	const update = useUpdateBusiness();

	const form = useForm({
		defaultValues: {
			businessName: profile.businessName,
			region: profile.region ?? "",
			city: profile.city ?? "",
			tagline: profile.tagline ?? "",
			website: profile.website ?? "",
			yearsInBusiness:
				profile.yearsInBusiness === null ? "" : String(profile.yearsInBusiness),
			bio: profile.bio ?? "",
		},
		validators: { onChange: BusinessFormSchema },
		onSubmit: ({ value }) => {
			const years = value.yearsInBusiness.trim()
				? Number(value.yearsInBusiness)
				: undefined;
			update.mutate(
				{
					businessName: value.businessName.trim(),
					region: value.region.trim(),
					city: value.city.trim() || undefined,
					tagline: value.tagline.trim() || undefined,
					website: value.website.trim() || undefined,
					yearsInBusiness:
						years !== undefined && !Number.isNaN(years) ? years : undefined,
					bio: value.bio.trim() || undefined,
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
			className="flex flex-col gap-4"
		>
			<form.Field
				name="businessName"
				children={(field) => (
					<Field
						label="Business name"
						htmlFor="biz-name"
						error={
							field.state.meta.isTouched
								? field.state.meta.errors[0]?.message
								: undefined
						}
					>
						<Input
							id="biz-name"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							aria-invalid={
								field.state.meta.isTouched && field.state.meta.errors.length > 0
							}
						/>
					</Field>
				)}
			/>

			<div className="form-row">
				<form.Field
					name="city"
					children={(field) => (
						<Field label="City" htmlFor="biz-city" optional>
							<Input
								id="biz-city"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</Field>
					)}
				/>
				<form.Field
					name="region"
					children={(field) => (
						<Field
							label="Region"
							htmlFor="biz-region"
							error={
								field.state.meta.isTouched
									? field.state.meta.errors[0]?.message
									: undefined
							}
						>
							<Input
								id="biz-region"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								aria-invalid={
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0
								}
							/>
						</Field>
					)}
				/>
			</div>

			<div className="form-row">
				<form.Field
					name="website"
					children={(field) => (
						<Field label="Website" htmlFor="biz-website" optional>
							<Input
								id="biz-website"
								placeholder="studio.com"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</Field>
					)}
				/>
				<form.Field
					name="yearsInBusiness"
					children={(field) => (
						<Field label="Years in business" htmlFor="biz-years" optional>
							<Input
								id="biz-years"
								type="number"
								min={0}
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</Field>
					)}
				/>
			</div>

			<form.Field
				name="tagline"
				children={(field) => (
					<Field label="Tagline" htmlFor="biz-tagline" optional>
						<Input
							id="biz-tagline"
							placeholder="A short line couples will remember"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</Field>
				)}
			/>

			<form.Field
				name="bio"
				children={(field) => (
					<Field label="About" htmlFor="biz-bio" optional>
						<Textarea
							id="biz-bio"
							rows={4}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</Field>
				)}
			/>

			<div className="form-actions">
				{onCancel && (
					<Button
						type="button"
						tone="secondary"
						variant="ghost"
						onClick={onCancel}
					>
						Cancel
					</Button>
				)}
				<form.Subscribe
					selector={(s) => s.canSubmit}
					children={(canSubmit) => (
						<Button type="submit" disabled={update.isPending || !canSubmit}>
							Save details
						</Button>
					)}
				/>
			</div>
		</form>
	);
}
