"use client";

import { Skeleton } from "@repo/ui/components/skeleton";
import { useChecklist, useToggleChecklistTask } from "../../api/checklist.api";
import { useWeddingSummary } from "../../api/wedding.api";
import { BudgetPanel } from "../../components/dashboard/budget-panel";
import { ChecklistPreview } from "../../components/dashboard/checklist-preview";
import { Masthead } from "../../components/dashboard/masthead";
import { RecommendationList } from "../../components/dashboard/recommendation-list";
import { useAuth } from "../../hooks/use-auth";

function DashboardSkeleton() {
	return (
		<div className="flex flex-col gap-10">
			<Skeleton className="h-24 w-full" />
			<div className="grid gap-8 md:grid-cols-5 md:gap-10">
				<Skeleton className="h-80 w-full md:col-span-3" />
				<Skeleton className="h-80 w-full md:col-span-2" />
			</div>
		</div>
	);
}

export default function CoupleDashboard() {
	const { user } = useAuth();
	const firstName = user?.name?.trim().split(" ")[0] || "there";

	const summary = useWeddingSummary();
	const checklist = useChecklist();
	const toggleTask = useToggleChecklistTask();

	const isLoading = summary.isLoading || checklist.isLoading;
	const error = summary.error ?? checklist.error;

	return (
		<div className="min-h-screen bg-background p-6">
			{isLoading ? (
				<DashboardSkeleton />
			) : error ? (
				<p className="text-destructive-foreground text-sm">{error.message}</p>
			) : summary.data && checklist.data ? (
				<div className="rise-in flex flex-col gap-10">
					<Masthead firstName={firstName} summary={summary.data} />
					<div className="grid gap-8 md:grid-cols-5 md:gap-10">
						<div className="md:col-span-3">
							<ChecklistPreview
								items={checklist.data.items}
								onToggleTask={(uuid, isComplete) =>
									toggleTask.mutate({ uuid, isComplete })
								}
							/>
						</div>
						<div className="flex flex-col gap-8 md:col-span-2">
							<BudgetPanel budget={summary.data.budget} />
							<hr className="stitch-rule" />
							<RecommendationList
								recommendations={summary.data.recommendations}
							/>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
