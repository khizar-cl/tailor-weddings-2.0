"use client";

import { TIER_LIMITS } from "@repo/shared";
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

// New vendors start on the free tier, which caps how many services they can
// offer. The server enforces the same limit against the account's actual tier.
const MAX_SERVICES = TIER_LIMITS.free.maxServices;

const VendorFormSchema = z.object({
	businessName: z.string().trim().min(2, "Enter your business name"),
	categoryUuids: z.array(z.string()).min(1, "Choose at least one service"),
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
			categoryUuids: [] as string[],
			region: "",
			city: "",
			tagline: "",
		},
		validators: { onChange: VendorFormSchema },
		onSubmit: ({ value }) => {
			submit.mutate({
				businessName: value.businessName.trim(),
				categoryUuids: value.categoryUuids,
				region: value.region.trim(),
				city: value.city.trim() || undefined,
				tagline: value.tagline.trim() || undefined,
			});
		},
	});

	async function goToReach() {
		const errors = await Promise.all([
			form.validateField("businessName", "change"),
			form.validateField("categoryUuids", "change"),
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
							<p className="docket mb-1 text-thread-ink">Step 01</p>
							<h2 className="display-title text-2xl text-foreground">
								Your business
							</h2>
							<p className="mt-1 text-muted-foreground text-sm">
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

						<form.Field name="categoryUuids">
							{(field) => (
								<div className="form-container">
									<Label>Services you offer</Label>
									<p className="help-text">
										Your plan includes {MAX_SERVICES} service
										{MAX_SERVICES === 1 ? "" : "s"}. You can add more after
										upgrading.
									</p>
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
											selected={field.state.value}
											onToggle={(value) => {
												const current = field.state.value;
												if (current.includes(value)) {
													field.handleChange(
														current.filter((v) => v !== value),
													);
												} else if (MAX_SERVICES === 1) {
													field.handleChange([value]);
												} else if (current.length < MAX_SERVICES) {
													field.handleChange([...current, value]);
												}
											}}
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
							<p className="docket mb-1 text-thread-ink">Step 02</p>
							<h2 className="display-title text-2xl text-foreground">
								Where you work
							</h2>
							<p className="mt-1 text-muted-foreground text-sm">
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
