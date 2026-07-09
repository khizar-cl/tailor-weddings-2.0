import type { CategoryItem } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useForm } from "@tanstack/react-form";
import { SearchIcon } from "lucide-react";
import { z } from "zod";

const DiscoverFiltersSchema = z.object({
	query: z.string(),
	region: z.string(),
});

interface DiscoverFiltersProps {
	categories: CategoryItem[];
	/** Committed values, derived from the URL. */
	query: string;
	region: string;
	categoryUuid: string;
	/** Applies the free-text fields (search button or Enter). */
	onSearch: (query: string, region: string) => void;
	/** Category applies immediately, without waiting for a search. */
	onCategoryChange: (value: string) => void;
	onReset: () => void;
	hasActiveFilters: boolean;
}

export function DiscoverFilters({
	categories,
	query,
	region,
	categoryUuid,
	onSearch,
	onCategoryChange,
	onReset,
	hasActiveFilters,
}: DiscoverFiltersProps) {
	const categoryLabels: Record<string, string> = {
		"": "All categories",
		...Object.fromEntries(categories.map((c) => [c.uuid, c.name])),
	};

	const form = useForm({
		defaultValues: { query, region },
		validators: { onChange: DiscoverFiltersSchema },
		onSubmit: ({ value }) => onSearch(value.query, value.region),
	});

	const controlHeight = "h-9";

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
		>
			<form.Field
				name="query"
				children={(field) => (
					<div className="form-container w-full sm:min-w-56 sm:flex-2">
						<Label htmlFor="discover-search">Search</Label>
						<div className="relative">
							<SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="discover-search"
								className={`${controlHeight} pl-9`}
								placeholder="Business name"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</div>
					</div>
				)}
			/>

			<div className="form-container w-full sm:min-w-40 sm:flex-1">
				<Label htmlFor="discover-category">Category</Label>
				<Select
					items={categoryLabels}
					value={categoryUuid}
					onValueChange={(value) => onCategoryChange(value as string)}
				>
					<SelectTrigger
						id="discover-category"
						className={`${controlHeight} w-full text-sm data-[size=default]:h-9`}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent alignItemWithTrigger={false}>
						<SelectItem value="">All categories</SelectItem>
						{categories.map((category) => (
							<SelectItem key={category.uuid} value={category.uuid}>
								{category.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<form.Field
				name="region"
				children={(field) => (
					<div className="form-container w-full sm:min-w-40 sm:flex-1">
						<Label htmlFor="discover-region">Region</Label>
						<Input
							id="discover-region"
							className={controlHeight}
							placeholder="e.g. Texas"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			/>

			<div className="flex gap-2 sm:ml-auto">
				<Button type="submit" className={controlHeight}>
					<SearchIcon />
					Search
				</Button>
				<Button
					type="button"
					tone="secondary"
					variant="outline"
					className={controlHeight}
					disabled={!hasActiveFilters}
					onClick={onReset}
				>
					Clear
				</Button>
			</div>
		</form>
	);
}
