import { protectedProcedure } from "../../orpc/procedures";
import {
	cancelBooking,
	confirmBooking,
	listForWedding,
	listRequests,
	requestBooking,
} from "./booking.service";

export const bookingController = {
	request: protectedProcedure.booking.request.handler(
		async ({ context, input }) => {
			return requestBooking(context.dbUser.id, input);
		},
	),
	confirm: protectedProcedure.booking.confirm.handler(
		async ({ context, input }) => {
			return confirmBooking(context.dbUser.id, input.bookingUuid);
		},
	),
	cancel: protectedProcedure.booking.cancel.handler(
		async ({ context, input }) => {
			return cancelBooking(context.dbUser.id, input.bookingUuid);
		},
	),
	listForWedding: protectedProcedure.booking.listForWedding.handler(
		async ({ context }) => {
			return listForWedding(context.dbUser.id);
		},
	),
	listRequests: protectedProcedure.booking.listRequests.handler(
		async ({ context }) => {
			return listRequests(context.dbUser.id);
		},
	),
};
