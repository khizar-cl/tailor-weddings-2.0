"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { useIsMobile } from "@repo/ui/hooks/use-mobile";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useCategories } from "../../../api/category.api";
import {
	useAddChecklistTask,
	useChecklist,
	useRemoveChecklistTask,
	useToggleChecklistTask,
} from "../../../api/checklist.api";
import { AppBreadcrumb } from "../../../components/app-breadcrumb";
import { AddTaskForm } from "../../../components/checklist/add-task-form";
import { ChecklistBoard } from "../../../components/checklist/checklist-board";
import Loader from "../../../components/loader";

export default function ChecklistPage() {
	const isMobile = useIsMobile();
	const [addOpen, setAddOpen] = useState(false);

	const checklist = useChecklist();
	const categories = useCategories();
	const toggle = useToggleChecklistTask();
	const add = useAddChecklistTask();
	const remove = useRemoveChecklistTask();

	const items = checklist.data?.items ?? [];
	const done = items.filter((item) => item.isComplete).length;
	const categoryList = categories.data?.categories ?? [];

	const board = checklist.isLoading ? (
		<Loader />
	) : checklist.error ? (
		<p className="text-destructive-foreground text-sm">
			{checklist.error.message}
		</p>
	) : (
		<ChecklistBoard
			items={items}
			onToggle={(uuid, isComplete) => toggle.mutate({ uuid, isComplete })}
			onRemove={(uuid) => remove.mutate({ uuid })}
		/>
	);

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			<div className="rise-in">
				<header className="border-border border-b pb-6">
					<span className="docket text-thread-ink">Planning</span>
					<div className="mt-2 flex items-end justify-between gap-4">
						<h1 className="font-medium font-serif text-3xl text-foreground sm:text-4xl">
							Checklist
						</h1>
						{items.length > 0 && (
							<span className="docket-num text-muted-foreground text-sm">
								{done} / {items.length} done
							</span>
						)}
					</div>
					<p className="mt-2 max-w-md text-muted-foreground text-sm">
						Your tailored plan — add your own tasks and check things off as you
						go.
					</p>
				</header>

				{isMobile ? (
					<div className="mt-6">
						<Button className="w-full" onClick={() => setAddOpen(true)}>
							<PlusIcon className="size-4" />
							Add task
						</Button>
						<div className="mt-8">{board}</div>

						<Dialog open={addOpen} onOpenChange={setAddOpen}>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add a task</DialogTitle>
								</DialogHeader>
								<AddTaskForm
									categories={categoryList}
									onAdd={(input) => {
										add.mutate(input);
										setAddOpen(false);
									}}
									isPending={add.isPending}
								/>
							</DialogContent>
						</Dialog>
					</div>
				) : (
					<div className="@container mt-6">
						<div className="grid @3xl:grid-cols-[minmax(0,1fr)_20rem] grid-cols-1 gap-10">
							{/* Single column: form leads, board follows. Two columns: board
							    left, form right (DOM order kept for desktop focus order). */}
							<div className="@3xl:order-0 order-last">{board}</div>
							<aside className="@3xl:sticky @3xl:top-20 @3xl:self-start">
								<h2 className="text-base">Add a task</h2>
								<div className="mt-4">
									<AddTaskForm
										categories={categoryList}
										onAdd={(input) => add.mutate(input)}
										isPending={add.isPending}
									/>
								</div>
							</aside>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
