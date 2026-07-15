import { generateReviewRequests } from "../../controllers/review/review.service";
import { logger } from "../../utils/logger";
import { QUEUES, registerJob } from "../job-registry";

/**
 * T+1 review requests. Runs daily; `generateReviewRequests` is idempotent, so
 * the exact firing time only affects latency, not correctness.
 */
registerJob({
	queue: QUEUES.REVIEW_REQUESTS,
	handler: async () => {
		const { created } = await generateReviewRequests(new Date());
		logger.info({ created }, "Generated review requests");
	},
	schedule: {
		schedulerId: "review-requests-daily",
		pattern: "0 2 * * *", // 02:00 every day
	},
});
