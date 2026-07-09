"use client";

import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCategories } from "../../../api/category.api";
import { useVendorSearch } from "../../../api/vendor.api";
import { AppBreadcrumb } from "../../../components/app-breadcrumb";
import { DiscoverFilters } from "../../../components/discover/discover-filters";
import { VendorCard } from "../../../components/discover/vendor-card";
import { VendorRow } from "../../../components/discover/vendor-row";

type ViewMode = "list" | "grid";

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

function ViewToggle({
	view,
	onChange,
}: {
	view: ViewMode;
	onChange: (view: ViewMode) => void;
}) {
	return (
		<div className="flex items-center border border-border">
			<Button
				type="button"
				tone="secondary"
				variant={view === "list" ? "solid" : "ghost"}
				size="icon-sm"
				className="rounded-none"
				aria-pressed={view === "list"}
				aria-label="List view"
				onClick={() => onChange("list")}
			>
				<ListIcon />
			</Button>
			<Button
				type="button"
				tone="secondary"
				variant={view === "grid" ? "solid" : "ghost"}
				size="icon-sm"
				className="rounded-none"
				aria-pressed={view === "grid"}
				aria-label="Grid view"
				onClick={() => onChange("grid")}
			>
				<LayoutGridIcon />
			</Button>
		</div>
	);
}

function DiscoverContent() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();

	const query = params.get("q") ?? "";
	const region = params.get("region") ?? "";
	const categoryUuid = params.get("category") ?? "";
	const view: ViewMode = params.get("view") === "grid" ? "grid" : "list";
	const pageParam = Number(params.get("page"));
	const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

	const categories = useCategories();
	const search = useVendorSearch({
		page,
		query: query.trim() || undefined,
		region: region.trim() || undefined,
		categoryUuid: categoryUuid || undefined,
	});

	/** Merge param updates into the current URL — the single source of filter truth. */
	const updateParams = (updates: Record<string, string | null>) => {
		const next = new URLSearchParams(params.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (value) next.set(key, value);
			else next.delete(key);
		}
		const qs = next.toString();
		router.replace((qs ? `${pathname}?${qs}` : pathname) as Route, {
			scroll: false,
		});
	};

	// Any filter change returns to the first page.
	const applySearch = (nextQuery: string, nextRegion: string) =>
		updateParams({
			q: nextQuery.trim() || null,
			region: nextRegion.trim() || null,
			page: null,
		});
	const changeCategory = (value: string) =>
		updateParams({ category: value || null, page: null });
	const changeView = (next: ViewMode) =>
		updateParams({ view: next === "grid" ? "grid" : null });
	const goToPage = (next: number) =>
		updateParams({ page: next > 1 ? String(next) : null });
	const reset = () =>
		updateParams({ q: null, region: null, category: null, page: null });

	const hasActiveFilters = Boolean(query || region || categoryUuid);
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
						key={`${query}|${region}`}
						categories={categories.data?.categories ?? []}
						query={query}
						region={region}
						categoryUuid={categoryUuid}
						onSearch={applySearch}
						onCategoryChange={changeCategory}
						onReset={reset}
						hasActiveFilters={hasActiveFilters}
					/>

					<div className="mt-8 flex items-center justify-end border-border border-b pb-3">
						<ViewToggle view={view} onChange={changeView} />
					</div>

					<div className="mt-6">
						{search.isLoading ? (
							<ResultsSkeleton />
						) : search.error ? (
							<p className="text-destructive-foreground text-sm">
								{search.error.message}
							</p>
						) : result && result.items.length > 0 ? (
							<>
								{view === "grid" ? (
									<ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
										{result.items.map((vendor) => (
											<VendorCard key={vendor.uuid} vendor={vendor} />
										))}
									</ul>
								) : (
									<ul>
										{result.items.map((vendor) => (
											<VendorRow key={vendor.uuid} vendor={vendor} />
										))}
									</ul>
								)}
								{(result.page > 1 || result.hasMore) && (
									<div className="mt-8 flex items-center justify-between">
										<Button
											type="button"
											tone="secondary"
											variant="outline"
											disabled={result.page <= 1}
											onClick={() => goToPage(result.page - 1)}
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
											onClick={() => goToPage(result.page + 1)}
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

export default function DiscoverPage() {
	return (
		<Suspense>
			<DiscoverContent />
		</Suspense>
	);
}
