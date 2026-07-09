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
import { SearchIcon } from "lucide-react";

interface DiscoverFiltersProps {
	categories: CategoryItem[];
	query: string;
	onQueryChange: (value: string) => void;
	categoryUuid: string;
	onCategoryChange: (value: string) => void;
	region: string;
	onRegionChange: (value: string) => void;
	onReset: () => void;
	hasActiveFilters: boolean;
}

export function DiscoverFilters({
	categories,
	query,
	onQueryChange,
	categoryUuid,
	onCategoryChange,
	region,
	onRegionChange,
	onReset,
	hasActiveFilters,
}: DiscoverFiltersProps) {
	const categoryLabels: Record<string, string> = {
		"": "All categories",
		...Object.fromEntries(categories.map((c) => [c.uuid, c.name])),
	};

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
			<div className="form-container sm:flex-1">
				<Label htmlFor="discover-search">Search</Label>
				<div className="relative">
					<SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="discover-search"
						className="pl-9"
						placeholder="Business name"
						value={query}
						onChange={(e) => onQueryChange(e.target.value)}
					/>
				</div>
			</div>

			<div className="form-container sm:w-52">
				<Label htmlFor="discover-category">Category</Label>
				<Select
					items={categoryLabels}
					value={categoryUuid}
					onValueChange={(value) => onCategoryChange(value as string)}
				>
					<SelectTrigger id="discover-category" className="w-full">
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

			<div className="form-container sm:w-44">
				<Label htmlFor="discover-region">Region</Label>
				<Input
					id="discover-region"
					placeholder="e.g. Texas"
					value={region}
					onChange={(e) => onRegionChange(e.target.value)}
				/>
			</div>

			{hasActiveFilters && (
				<Button
					type="button"
					tone="secondary"
					variant="outline"
					onClick={onReset}
					className="shrink-0"
				>
					Clear
				</Button>
			)}
		</div>
	);
}
