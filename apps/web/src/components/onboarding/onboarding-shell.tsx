import { cn } from "@repo/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Wordmark } from "../wordmark";

interface OnboardingShellProps {
	brand: { icon: LucideIcon; name: string };
	eyebrow: string;
	title: string;
	subtitle: string;
	steps: string[];
	currentStep: number;
	children: ReactNode;
}

function pad(n: number) {
	return String(n).padStart(2, "0");
}

function StepDots({
	steps,
	currentStep,
}: {
	steps: string[];
	currentStep: number;
}) {
	return (
		<div className="flex items-center gap-1.5">
			{steps.map((label, i) => (
				<div
					key={label}
					className={cn(
						"h-0.5 transition-all duration-300",
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
				<aside className="hairline hidden flex-col justify-between border-r p-10 md:flex lg:p-14">
					<Wordmark />

					<div className="max-w-sm">
						<div className="flex items-center gap-2.5">
							<span className="swatch flex size-8 items-center justify-center text-thread-ink">
								<BrandIcon className="size-4" strokeWidth={1.75} />
							</span>
							<span className="docket text-thread-ink">{eyebrow}</span>
						</div>
						<h1 className="display-title mt-5 text-4xl text-foreground leading-[1.05]">
							{title}
						</h1>
						<p className="mt-4 text-muted-foreground text-sm leading-relaxed">
							{subtitle}
						</p>

						<ol className="mt-9 space-y-0">
							{steps.map((label, i) => {
								const isCurrent = i === currentStep;
								const isDone = i < currentStep;
								return (
									<li
										key={label}
										className={cn(
											"flex items-baseline gap-4 py-3 transition-colors",
											i > 0 && "hairline border-t",
											isCurrent ? "text-foreground" : "text-muted-foreground",
										)}
									>
										<span
											className={cn(
												"docket-num text-sm",
												isCurrent
													? "text-thread-ink"
													: isDone
														? "text-thread-ink/70"
														: "text-muted-foreground",
											)}
										>
											{pad(i + 1)}
										</span>
										<span className="text-sm">{label}</span>
										{isCurrent && (
											<span
												className="stitch-rule ml-auto h-0.5 w-8 self-center"
												aria-hidden
											/>
										)}
									</li>
								);
							})}
						</ol>
					</div>

					<div>
						<hr className="stitch-rule mb-4 w-12" aria-hidden />
						<p className="docket text-muted-foreground normal-case">
							You can change any of this later from your dashboard.
						</p>
					</div>
				</aside>

				<main className="flex flex-col justify-center px-5 py-10 md:px-12 md:py-12">
					<div className="mx-auto w-full max-w-md">
						<div className="mb-8 flex items-center justify-between md:hidden">
							<Wordmark />
							<StepDots steps={steps} currentStep={currentStep} />
						</div>
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
