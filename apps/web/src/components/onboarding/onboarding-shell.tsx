import { cn } from "@repo/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface OnboardingShellProps {
	brand: { icon: LucideIcon; name: string };
	eyebrow: string;
	title: string;
	subtitle: string;
	steps: string[];
	currentStep: number;
	children: ReactNode;
}

function StepDots({
	steps,
	currentStep,
}: {
	steps: string[];
	currentStep: number;
}) {
	return (
		<div className="flex items-center gap-2">
			{steps.map((label, i) => (
				<div
					key={label}
					className={cn(
						"h-1.5 rounded-full transition-all duration-300",
						i === currentStep
							? "w-8 bg-gold"
							: i < currentStep
								? "w-4 bg-gold/60"
								: "w-4 bg-border",
					)}
				/>
			))}
		</div>
	);
}

export function OnboardingShell({
	brand,
	eyebrow,
	title,
	subtitle,
	steps,
	currentStep,
	children,
}: OnboardingShellProps) {
	const BrandIcon = brand.icon;

	return (
		<div className="brand-backdrop min-h-screen">
			<div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 md:grid-cols-[0.85fr_1.15fr]">
				<aside className="hidden flex-col justify-between border-border/60 border-r p-10 md:flex lg:p-14">
					<div className="flex items-center gap-2 text-foreground">
						<span className="flex size-8 items-center justify-center rounded-md bg-gold/12 text-gold">
							<BrandIcon className="size-4" />
						</span>
						<span className="font-medium text-sm tracking-tight">
							Tailor Weddings
						</span>
					</div>

					<div className="max-w-sm">
						<p className="section-label text-gold">{eyebrow}</p>
						<h1 className="display-title mt-3 text-4xl text-foreground leading-[1.05]">
							{title}
						</h1>
						<p className="mt-4 text-muted-foreground text-sm leading-relaxed">
							{subtitle}
						</p>

						<ol className="mt-8 space-y-3">
							{steps.map((label, i) => (
								<li
									key={label}
									className={cn(
										"flex items-center gap-3 text-sm transition-colors",
										i === currentStep
											? "text-foreground"
											: "text-muted-foreground",
									)}
								>
									<span
										className={cn(
											"flex size-6 items-center justify-center rounded-full border text-xs",
											i === currentStep
												? "border-gold bg-gold/12 text-gold"
												: i < currentStep
													? "border-gold/50 text-gold/70"
													: "border-border",
										)}
									>
										{i + 1}
									</span>
									{label}
								</li>
							))}
						</ol>
					</div>

					<div>
						<hr className="gold-rule mb-4" />
						<p className="text-muted-foreground text-xs">
							You can change any of this later from your dashboard.
						</p>
					</div>
				</aside>

				<main className="flex flex-col justify-center px-5 py-10 md:px-12 md:py-12">
					<div className="mx-auto w-full max-w-md">
						<div className="mb-6 flex items-center justify-between md:hidden">
							<div className="flex items-center gap-2 text-foreground">
								<span className="flex size-7 items-center justify-center rounded-md bg-gold/12 text-gold">
									<BrandIcon className="size-4" />
								</span>
								<span className="font-medium text-sm">{brand.name}</span>
							</div>
							<StepDots steps={steps} currentStep={currentStep} />
						</div>
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
