import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { StarIcon } from "lucide-react";

const STARS = [1, 2, 3, 4, 5] as const;

/** Read-only 1–5 star display. */
export function ReviewStars({
	rating,
	className,
}: {
	rating: number;
	className?: string;
}) {
	return (
		<span
			className={cn("inline-flex items-center gap-0.5", className)}
			role="img"
			aria-label={`${rating} out of 5`}
		>
			{STARS.map((star) => (
				<StarIcon
					key={star}
					className={cn(
						"size-4",
						star <= rating
							? "fill-current text-thread-ink"
							: "text-muted-foreground",
					)}
					strokeWidth={1.75}
				/>
			))}
		</span>
	);
}

/** Interactive 1–5 star picker for the review form. */
export function StarRatingInput({
	value,
	onChange,
	disabled,
}: {
	value: number;
	onChange: (value: number) => void;
	disabled?: boolean;
}) {
	return (
		<div className="flex items-center gap-1">
			{STARS.map((star) => (
				<Button
					key={star}
					type="button"
					tone="secondary"
					variant="ghost"
					size="icon-sm"
					disabled={disabled}
					aria-label={`${star} star${star === 1 ? "" : "s"}`}
					aria-pressed={value === star}
					onClick={() => onChange(star)}
				>
					<StarIcon
						className={cn(
							"size-5",
							star <= value
								? "fill-current text-thread-ink"
								: "text-muted-foreground",
						)}
						strokeWidth={1.75}
					/>
				</Button>
			))}
		</div>
	);
}
