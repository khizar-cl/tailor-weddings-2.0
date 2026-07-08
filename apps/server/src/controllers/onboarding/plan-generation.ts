import { subMonths } from "date-fns";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
	budgetItems,
	categories,
	checklistItems,
	type db,
	vendorRecommendations,
	vendorServices,
} from "../../db";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Date-relative planning checklist. `monthsBefore` is the ideal lead time back
 * from the wedding date; `categorySlug` links a task to a vendor category when
 * one applies (tasks with no natural category stay uncategorized). Order here
 * is the display order; phase grouping is derived from the due date by the UI.
 */
const CHECKLIST_TEMPLATE: Array<{
	title: string;
	categorySlug?: string;
	monthsBefore: number;
}> = [
	{ title: "Set your budget", categorySlug: "planning", monthsBefore: 12 },
	{
		title: "Draft your guest list",
		categorySlug: "planning",
		monthsBefore: 12,
	},
	{ title: "Book your venue", categorySlug: "venue", monthsBefore: 11 },
	{
		title: "Book your photographer",
		categorySlug: "photography",
		monthsBefore: 9,
	},
	{ title: "Book your caterer", categorySlug: "catering", monthsBefore: 9 },
	{ title: "Choose a color palette", monthsBefore: 8 },
	{
		title: "Send save-the-dates",
		categorySlug: "stationery",
		monthsBefore: 6,
	},
	{
		title: "Book music & entertainment",
		categorySlug: "music-dj",
		monthsBefore: 6,
	},
	{ title: "Order your cake", categorySlug: "cake-desserts", monthsBefore: 6 },
	{ title: "Send invitations", categorySlug: "stationery", monthsBefore: 3 },
	{ title: "Confirm final guest count", monthsBefore: 1 },
	{
		title: "Finalize the day-of timeline",
		categorySlug: "planning",
		monthsBefore: 1,
	},
];

/** Starting split of the couple's budget across categories. Sums to 1.0. */
const BUDGET_ALLOCATION = [
	{ category: "Venue", label: "Venue", pct: 0.4 },
	{ category: "Catering", label: "Catering", pct: 0.22 },
	{ category: "Photography", label: "Photography", pct: 0.1 },
	{ category: "Floral & Décor", label: "Floral & décor", pct: 0.08 },
	{ category: "Music", label: "Music & entertainment", pct: 0.07 },
	{ category: "Attire", label: "Attire", pct: 0.06 },
	{ category: "Stationery", label: "Stationery", pct: 0.03 },
	{ category: "Other", label: "Other", pct: 0.04 },
] as const;

const MAX_RECOMMENDATIONS = 12;

interface GenerateParams {
	weddingId: number;
	dbUserId: number;
	weddingDate: Date | null;
	estimatedBudgetCents: number;
	region: string | null;
}

/**
 * Seed (or re-seed) a wedding's planner output: a phased checklist, a budget
 * template, and vendor recommendations. Only generated/suggested rows are
 * replaced — the couple's own manual tasks, manual/booking budget lines, and
 * accepted/dismissed recommendations survive a regeneration. Runs inside the
 * onboarding transaction.
 */
export async function generateCouplePlan(
	tx: Transaction,
	params: GenerateParams,
) {
	const { weddingId, dbUserId, weddingDate, estimatedBudgetCents, region } =
		params;

	await tx
		.delete(checklistItems)
		.where(
			and(
				eq(checklistItems.weddingId, weddingId),
				eq(checklistItems.source, "generated"),
			),
		);
	await tx
		.delete(budgetItems)
		.where(
			and(
				eq(budgetItems.weddingId, weddingId),
				eq(budgetItems.source, "generated"),
			),
		);
	await tx
		.delete(vendorRecommendations)
		.where(
			and(
				eq(vendorRecommendations.weddingId, weddingId),
				eq(vendorRecommendations.status, "suggested"),
			),
		);

	// Resolve the template's category slugs to ids in one query. Slugs that
	// aren't seeded simply resolve to null (uncategorized task).
	const neededSlugs = [
		...new Set(
			CHECKLIST_TEMPLATE.map((task) => task.categorySlug).filter(
				(slug): slug is string => Boolean(slug),
			),
		),
	];
	const categoryRows = neededSlugs.length
		? await tx.query.categories.findMany({
				where: inArray(categories.slug, neededSlugs),
				columns: { id: true, slug: true },
			})
		: [];
	const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

	// When the runway between onboarding and the wedding is short, a task's
	// ideal window may already be in the past. Drop those due dates (the UI
	// surfaces undated generated tasks as "start now") rather than showing a
	// pile of already-overdue items.
	const now = new Date();
	await tx.insert(checklistItems).values(
		CHECKLIST_TEMPLATE.map((task, index) => {
			const idealDue = weddingDate
				? subMonths(weddingDate, task.monthsBefore)
				: null;
			const overdue = idealDue !== null && idealDue < now;
			return {
				weddingId,
				title: task.title,
				categoryId: task.categorySlug
					? (categoryIdBySlug.get(task.categorySlug) ?? null)
					: null,
				dueDate: overdue ? null : idealDue,
				source: "generated" as const,
				sortOrder: index,
				createdBy: dbUserId,
				updatedBy: dbUserId,
			};
		}),
	);

	await tx.insert(budgetItems).values(
		BUDGET_ALLOCATION.map((line) => ({
			weddingId,
			category: line.category,
			label: line.label,
			estimatedCents: Math.round(estimatedBudgetCents * line.pct),
			source: "generated" as const,
			createdBy: dbUserId,
			updatedBy: dbUserId,
		})),
	);

	await generateRecommendations(tx, { weddingId, dbUserId, region });
}

async function generateRecommendations(
	tx: Transaction,
	{
		weddingId,
		dbUserId,
		region,
	}: { weddingId: number; dbUserId: number; region: string | null },
) {
	const services = await tx.query.vendorServices.findMany({
		where: and(
			eq(vendorServices.isPublished, true),
			isNull(vendorServices.deletedAt),
		),
		with: {
			business: {
				columns: { id: true, region: true, isVerified: true, deletedAt: true },
			},
			category: { columns: { id: true, name: true } },
		},
	});

	// One recommendation per business — keep its best-scoring service.
	const byBusiness = new Map<
		number,
		{
			vendorBusinessId: number;
			categoryId: number;
			matchScore: number;
			rationale: string;
		}
	>();

	for (const service of services) {
		// Custom (uncategorized) services aren't discoverable until promoted.
		if (service.categoryId === null) continue;
		const business = service.business;
		if (!business || business.deletedAt !== null) continue;

		const regionMatch =
			!!region &&
			!!business.region &&
			business.region.toLowerCase() === region.toLowerCase();

		let matchScore = 60;
		if (regionMatch) matchScore += 25;
		if (business.isVerified) matchScore += 15;

		const categoryName = service.category?.name ?? "your plan";
		const rationale = regionMatch
			? `Matched on ${categoryName} in ${business.region}`
			: `Matched on ${categoryName}`;

		const existing = byBusiness.get(business.id);
		if (!existing || matchScore > existing.matchScore) {
			byBusiness.set(business.id, {
				vendorBusinessId: business.id,
				categoryId: service.categoryId,
				matchScore,
				rationale,
			});
		}
	}

	const top = [...byBusiness.values()]
		.sort((a, b) => b.matchScore - a.matchScore)
		.slice(0, MAX_RECOMMENDATIONS);
	if (top.length === 0) return;

	await tx
		.insert(vendorRecommendations)
		.values(
			top.map((rec) => ({
				weddingId,
				vendorBusinessId: rec.vendorBusinessId,
				categoryId: rec.categoryId,
				matchScore: rec.matchScore,
				rationale: rec.rationale,
				createdBy: dbUserId,
				updatedBy: dbUserId,
			})),
		)
		.onConflictDoNothing({
			target: [
				vendorRecommendations.weddingId,
				vendorRecommendations.vendorBusinessId,
			],
		});
}
