"use client";

import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useEffect, useState } from "react";
import { useCategories } from "../../../api/category.api";
import { useVendorSearch } from "../../../api/vendor.api";
import { AppBreadcrumb } from "../../../components/app-breadcrumb";
import { DiscoverFilters } from "../../../components/discover/discover-filters";
import { VendorRow } from "../../../components/discover/vendor-row";

function useDebounced<T>(value: T, ms: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), ms);
		return () => clearTimeout(timer);
	}, [value, ms]);
	return debounced;
}

function ResultsSkeleton() {
	return (
		<ul>
			{[0, 1, 2, 3].map((i) => (
				<li
					key={i}
					className="flex gap-5 border-border border-b py-6 first:pt-0"
				>
					<Skeleton className="size-16 shrink-0" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-5 w-48" />
						<Skeleton className="h-3 w-32" />
						<Skeleton className="h-4 w-full max-w-md" />
					</div>
				</li>
			))}
		</ul>
	);
}

export default function DiscoverPage() {
	const [query, setQuery] = useState("");
	const [region, setRegion] = useState("");
	const [categoryUuid, setCategoryUuid] = useState("");
	const [page, setPage] = useState(1);

	const debouncedQuery = useDebounced(query, 300);
	const debouncedRegion = useDebounced(region, 300);

	const categories = useCategories();
	const search = useVendorSearch({
		page,
		query: debouncedQuery.trim() || undefined,
		region: debouncedRegion.trim() || undefined,
		categoryUuid: categoryUuid || undefined,
	});

	// Changing any filter returns to the first page.
	const changeQuery = (value: string) => {
		setQuery(value);
		setPage(1);
	};
	const changeRegion = (value: string) => {
		setRegion(value);
		setPage(1);
	};
	const changeCategory = (value: string) => {
		setCategoryUuid(value);
		setPage(1);
	};

	const hasActiveFilters = Boolean(query || region || categoryUuid);
	const reset = () => {
		setQuery("");
		setRegion("");
		setCategoryUuid("");
		setPage(1);
	};

	const result = search.data;

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			<div className="rise-in">
				<header className="border-border border-b pb-6">
					<span className="docket text-thread-ink">Vendors</span>
					<div className="mt-2 flex items-end justify-between gap-4">
						<h1 className="font-medium font-serif text-3xl text-foreground sm:text-4xl">
							Discover
						</h1>
						{result && (
							<span className="docket-num text-muted-foreground text-sm">
								{result.total} {result.total === 1 ? "vendor" : "vendors"}
							</span>
						)}
					</div>
					<p className="mt-2 max-w-md text-muted-foreground text-sm">
						Vendors measured to your day. Save the ones you love to your team.
					</p>
				</header>

				<div className="mt-8">
					<DiscoverFilters
						categories={categories.data?.categories ?? []}
						query={query}
						onQueryChange={changeQuery}
						categoryUuid={categoryUuid}
						onCategoryChange={changeCategory}
						region={region}
						onRegionChange={changeRegion}
						onReset={reset}
						hasActiveFilters={hasActiveFilters}
					/>

					<div className="mt-8">
						{search.isLoading ? (
							<ResultsSkeleton />
						) : search.error ? (
							<p className="text-destructive-foreground text-sm">
								{search.error.message}
							</p>
						) : result && result.items.length > 0 ? (
							<>
								<ul>
									{result.items.map((vendor) => (
										<VendorRow key={vendor.uuid} vendor={vendor} />
									))}
								</ul>
								{(result.page > 1 || result.hasMore) && (
									<div className="mt-8 flex items-center justify-between">
										<Button
											type="button"
											tone="secondary"
											variant="outline"
											disabled={result.page <= 1}
											onClick={() => setPage((p) => Math.max(1, p - 1))}
										>
											Previous
										</Button>
										<span className="docket text-muted-foreground">
											Page <span className="docket-num">{result.page}</span>
										</span>
										<Button
											type="button"
											tone="secondary"
											variant="outline"
											disabled={!result.hasMore}
											onClick={() => setPage((p) => p + 1)}
										>
											Next
										</Button>
									</div>
								)}
							</>
						) : (
							<div className="border-border border-t border-dashed py-16 text-center">
								<p className="text-foreground text-sm">No vendors found</p>
								<p className="mt-1 text-muted-foreground text-sm">
									{hasActiveFilters
										? "Try widening your filters."
										: "Check back soon — vendors are joining."}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
