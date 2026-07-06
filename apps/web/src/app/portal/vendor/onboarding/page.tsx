"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Spinner } from "@repo/ui/components/spinner";
import { Textarea } from "@repo/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { ArrowLeftIcon, ArrowRightIcon, StoreIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useCategories } from "../../../../api/category.api";
import { useSubmitVendorOnboarding } from "../../../../api/onboarding.api";
import { OnboardingShell } from "../../../../components/onboarding/onboarding-shell";
import { ChipSelect } from "../../../../components/onboarding/selectors";

const VendorFormSchema = z.object({
	businessName: z.string().trim().min(2, "Enter your business name"),
	categoryUuid: z.string().min(1, "Choose a category"),
	region: z.string().trim().min(1, "Enter the region you serve"),
	city: z.string(),
	tagline: z.string().max(200, "Keep your tagline under 200 characters"),
});

export default function VendorOnboardingPage() {
	const [step, setStep] = useState(0);
	const categoriesQuery = useCategories();

	const submit = useSubmitVendorOnboarding({
		// Hard navigation so the dashboard mounts with freshly fetched identity.
		onSuccess: () => {
			window.location.href = "/portal/vendor";
		},
	});

	const form = useForm({
		defaultValues: {
			businessName: "",
			categoryUuid: "",
			region: "",
			city: "",
			tagline: "",
		},
		validators: { onChange: VendorFormSchema },
		onSubmit: ({ value }) => {
			submit.mutate({
				businessName: value.businessName.trim(),
				categoryUuid: value.categoryUuid,
				region: value.region.trim(),
				city: value.city.trim() || undefined,
				tagline: value.tagline.trim() || undefined,
			});
		},
	});

	async function goToReach() {
		const errors = await Promise.all([
			form.validateField("businessName", "change"),
			form.validateField("categoryUuid", "change"),
		]);
		if (errors.every((e) => e.length === 0)) setStep(1);
	}

	const categoryOptions =
		categoriesQuery.data?.categories.map((c) => ({
			value: c.uuid,
			label: c.name,
		})) ?? [];

	return (
		<OnboardingShell
			brand={{ icon: StoreIcon, name: "Vendor" }}
			eyebrow="Welcome"
			title="Set up your studio"
			subtitle="Introduce your business so the right couples can find you. You can refine everything later."
			steps={["Your business", "Where you work"]}
			currentStep={step}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{step === 0 ? (
					<div className="space-y-4">
						<div>
							<h2 className="font-semibold text-foreground text-lg">
								Your business
							</h2>
							<p className="text-muted-foreground text-sm">
								This is what couples see first.
							</p>
						</div>

						<form.Field name="businessName">
							{(field) => (
								<div className="form-container">
									<Label htmlFor="businessName">Business name</Label>
									<Input
										id="businessName"
										placeholder="Vance Studio"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0
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
						</form.Field>

						<form.Field name="categoryUuid">
							{(field) => (
								<div className="form-container">
									<Label>Category</Label>
									{categoriesQuery.isLoading ? (
										<div className="flex items-center gap-2 text-muted-foreground text-sm">
											<Spinner className="size-4" />
											Loading categories…
										</div>
									) : categoryOptions.length === 0 ? (
										<p className="text-muted-foreground text-sm">
											No categories are available yet. Please try again later.
										</p>
									) : (
										<ChipSelect
											options={categoryOptions}
											selected={field.state.value ? [field.state.value] : []}
											onToggle={(value) =>
												field.handleChange(
													field.state.value === value ? "" : value,
												)
											}
											invalid={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											}
										/>
									)}
									{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 && (
											<p className="invalid-input">
												{field.state.meta.errors[0]?.message}
											</p>
										)}
								</div>
							)}
						</form.Field>

						<div className="form-actions">
							<Button type="button" onClick={goToReach}>
								Continue
								<ArrowRightIcon className="size-4" />
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div>
							<h2 className="font-semibold text-foreground text-lg">
								Where you work
							</h2>
							<p className="text-muted-foreground text-sm">
								Help couples nearby discover you.
							</p>
						</div>

						<div className="form-row">
							<form.Field name="region">
								{(field) => (
									<div className="form-container flex-1">
										<Label htmlFor="region">Region you serve</Label>
										<Input
											id="region"
											placeholder="Texas"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											aria-invalid={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
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
							</form.Field>

							<form.Field name="city">
								{(field) => (
									<div className="form-container flex-1">
										<Label htmlFor="city">Home city (optional)</Label>
										<Input
											id="city"
											placeholder="Austin"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="tagline">
							{(field) => (
								<div className="form-container">
									<Label htmlFor="tagline">Tagline (optional)</Label>
									<Textarea
										id="tagline"
										rows={2}
										placeholder="Timeless film photography for the modern couple."
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0
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
						</form.Field>

						<div className="flex items-center justify-between gap-2">
							<Button
								type="button"
								tone="secondary"
								variant="ghost"
								onClick={() => setStep(0)}
								disabled={submit.isPending}
							>
								<ArrowLeftIcon className="size-4" />
								Back
							</Button>
							<Button type="submit" disabled={submit.isPending}>
								{submit.isPending && <Spinner className="size-4" />}
								{submit.isPending ? "Setting up…" : "Go to my dashboard"}
							</Button>
						</div>
					</div>
				)}
			</form>
		</OnboardingShell>
	);
}
