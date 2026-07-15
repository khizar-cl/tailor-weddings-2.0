import { publishDueReviews } from "../../controllers/review/review.service";
import { logger } from "../../utils/logger";
import { QUEUES, registerJob } from "../job-registry";

/**
 * T+7 embargo lift. Runs daily; `publishDueReviews` is idempotent and also
 * sweeps up any late submissions for already-past weddings.
 */
registerJob({
	queue: QUEUES.REVIEW_PUBLISH,
	handler: async () => {
		const { published } = await publishDueReviews(new Date());
		logger.info({ published }, "Published due reviews");
	},
	schedule: {
		schedulerId: "review-publish-daily",
		pattern: "0 3 * * *", // 03:00 every day
	},
});
