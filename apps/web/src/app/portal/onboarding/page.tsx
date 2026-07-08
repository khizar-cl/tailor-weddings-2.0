"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Spinner } from "@repo/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { ArrowLeftIcon, ArrowRightIcon, HeartIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useSubmitCoupleOnboarding } from "../../../api/onboarding.api";
import { OnboardingShell } from "../../../components/onboarding/onboarding-shell";
import {
	ChipSelect,
	PaletteSelect,
} from "../../../components/onboarding/selectors";

const STYLE_OPTIONS = [
	"Modern",
	"Rustic",
	"Classic",
	"Bohemian",
	"Garden",
	"Coastal",
	"Vintage",
	"Industrial",
	"Romantic",
	"Minimalist",
	"Glamorous",
	"Whimsical",
].map((s) => ({ value: s, label: s }));

const PALETTE_OPTIONS = [
	"#A21C3B",
	"#E8C9A0",
	"#5A7D5A",
	"#8AA9C9",
	"#C98B9E",
	"#D9A566",
	"#B8CDB8",
	"#E4A0A0",
	"#6B4E71",
	"#C4703B",
	"#2E2A2A",
	"#F4EFE6",
];

const CoupleFormSchema = z.object({
	weddingDate: z.string(),
	budget: z
		.string()
		.refine((v) => Number(v) > 0, "Enter your estimated budget"),
	guestCount: z
		.string()
		.refine(
			(v) => Number.isInteger(Number(v)) && Number(v) > 0,
			"Enter an estimated guest count",
		),
	city: z.string().trim().min(1, "Enter your wedding city"),
	region: z.string(),
	styleTags: z.array(z.string()).min(1, "Pick at least one style"),
	palette: z.array(z.string()),
});

export default function CoupleOnboardingPage() {
	const [step, setStep] = useState(0);

	const submit = useSubmitCoupleOnboarding({
		// Hard navigation so the dashboard mounts with freshly fetched identity.
		onSuccess: () => {
			window.location.href = "/portal";
		},
	});

	const form = useForm({
		defaultValues: {
			weddingDate: "",
			budget: "",
			guestCount: "",
			city: "",
			region: "",
			styleTags: [] as string[],
			palette: [] as string[],
		},
		validators: { onChange: CoupleFormSchema },
		onSubmit: ({ value }) => {
			submit.mutate({
				weddingDate: value.weddingDate
					? new Date(value.weddingDate)
					: undefined,
				estimatedBudgetCents: Math.round(Number(value.budget) * 100),
				guestCountEstimate: Number(value.guestCount),
				city: value.city.trim(),
				region: value.region.trim() || undefined,
				styleTags: value.styleTags,
				stylePalette: value.palette,
			});
		},
	});

	async function goToStyle() {
		const errors = await Promise.all([
			form.validateField("budget", "change"),
			form.validateField("guestCount", "change"),
			form.validateField("city", "change"),
			form.validateField("weddingDate", "change"),
			form.validateField("region", "change"),
		]);
		if (errors.every((e) => e.length === 0)) setStep(1);
	}

	return (
		<OnboardingShell
			brand={{ icon: HeartIcon, name: "Planning" }}
			eyebrow="Let's begin"
			title="Tell us about your day"
			subtitle="A few details and we'll shape your plan — your dashboard, budget, and the vendors we surface for you."
			steps={["The basics", "Your style"]}
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
								The basics
							</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								Rough numbers are fine — you can refine them anytime.
							</p>
						</div>

						<form.Field name="weddingDate">
							{(field) => (
								<div className="form-container">
									<Label htmlFor="weddingDate">Wedding date (optional)</Label>
									<Input
										id="weddingDate"
										type="date"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
								</div>
							)}
						</form.Field>

						<div className="form-row">
							<form.Field name="budget">
								{(field) => (
									<div className="form-container flex-1">
										<Label htmlFor="budget">Estimated budget (USD)</Label>
										<Input
											id="budget"
											type="number"
											min={0}
											inputMode="numeric"
											placeholder="35000"
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

							<form.Field name="guestCount">
								{(field) => (
									<div className="form-container flex-1">
										<Label htmlFor="guestCount">Guest count</Label>
										<Input
											id="guestCount"
											type="number"
											min={1}
											inputMode="numeric"
											placeholder="120"
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
						</div>

						<div className="form-row">
							<form.Field name="city">
								{(field) => (
									<div className="form-container flex-1">
										<Label htmlFor="city">City</Label>
										<Input
											id="city"
											placeholder="Austin"
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

							<form.Field name="region">
								{(field) => (
									<div className="form-container flex-1">
										<Label htmlFor="region">State / region (optional)</Label>
										<Input
											id="region"
											placeholder="Texas"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
									</div>
								)}
							</form.Field>
						</div>

						<div className="form-actions">
							<Button type="button" onClick={goToStyle}>
								Continue
								<ArrowRightIcon className="size-4" />
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-6">
						<div>
							<p className="docket mb-1 text-thread-ink">Step 02</p>
							<h2 className="display-title text-2xl text-foreground">
								Your style
							</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								Pick the words and colors that feel like your day. We use these
								to match vendors.
							</p>
						</div>

						<form.Field name="styleTags">
							{(field) => (
								<div className="form-container">
									<Label>Style</Label>
									<ChipSelect
										options={STYLE_OPTIONS}
										selected={field.state.value}
										onToggle={(value) =>
											field.handleChange(
												field.state.value.includes(value)
													? field.state.value.filter((v) => v !== value)
													: [...field.state.value, value],
											)
										}
										invalid={
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

						<form.Field name="palette">
							{(field) => (
								<div className="form-container">
									<Label>Palette (optional)</Label>
									<PaletteSelect
										colors={PALETTE_OPTIONS}
										selected={field.state.value}
										onToggle={(hex) =>
											field.handleChange(
												field.state.value.includes(hex)
													? field.state.value.filter((v) => v !== hex)
													: [...field.state.value, hex],
											)
										}
									/>
									<p className="help-text">Choose up to eight colors.</p>
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
