"use client";

import type { PendingReviewRequestSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { useSubmitReview } from "../../api/review.api";
import { StarRatingInput } from "./review-stars";

const ReviewFormSchema = z.object({
	overallRating: z.number().int().min(1, "Pick a rating").max(5),
	body: z.string().trim().max(4000),
});

export function ReviewFormDialog({
	request,
}: {
	request: PendingReviewRequestSchema;
}) {
	const [open, setOpen] = useState(false);
	const submit = useSubmitReview();

	const form = useForm({
		defaultValues: { overallRating: 0, body: "" },
		validators: { onChange: ReviewFormSchema },
		onSubmit: ({ value }) => {
			submit.mutate(
				{
					reviewRequestUuid: request.uuid,
					overallRating: value.overallRating,
					body: value.body.trim() || undefined,
				},
				{
					onSuccess: () => {
						setOpen(false);
						form.reset();
					},
				},
			);
		},
	});

	const verb =
		request.type === "peer" ? "Review collaborator" : "Write a review";

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={<Button size="sm" tone="secondary" variant="outline" />}
			>
				{verb}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{request.subjectBusinessName}</DialogTitle>
					<DialogDescription>
						{request.type === "peer"
							? "Share how it was to work alongside this vendor."
							: "Tell other couples about your experience with this vendor."}
					</DialogDescription>
				</DialogHeader>

				<form
					className="flex flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<form.Field name="overallRating">
						{(field) => (
							<div className="form-container">
								<Label>Rating</Label>
								<StarRatingInput
									value={field.state.value}
									onChange={field.handleChange}
									disabled={submit.isPending}
								/>
							</div>
						)}
					</form.Field>

					<form.Field name="body">
						{(field) => (
							<div className="form-container">
								<Label htmlFor="review-body">Comments (optional)</Label>
								<Textarea
									id="review-body"
									rows={4}
									value={field.state.value}
									disabled={submit.isPending}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="What stood out?"
								/>
							</div>
						)}
					</form.Field>

					<div className="form-actions">
						<form.Subscribe selector={(s) => s.values.overallRating}>
							{(overallRating) => (
								<Button
									type="submit"
									disabled={submit.isPending || overallRating < 1}
								>
									Submit review
								</Button>
							)}
						</form.Subscribe>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
