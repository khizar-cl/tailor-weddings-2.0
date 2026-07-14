import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "../utils/orpc";

/**
 * The vendor's request inbox polls slowly so new requests appear without a
 * refresh. `refetchIntervalInBackground` defaults to false, so it pauses while
 * the tab is unfocused.
 */
const REQUESTS_POLL_MS = 20000;

/** The couple's own bookings, keyed by service for the vendor detail page. */
export function useWeddingBookings() {
	return useQuery(orpc.booking.listForWedding.queryOptions());
}

export function useVendorBookingRequests() {
	return useQuery({
		...orpc.booking.listRequests.queryOptions(),
		refetchInterval: REQUESTS_POLL_MS,
	});
}

/** A booking transition can touch both rosters, the team, and the budget. */
function useBookingInvalidator() {
	const queryClient = useQueryClient();
	return () => {
		for (const queryKey of [
			orpc.booking.listForWedding.key(),
			orpc.booking.listRequests.key(),
			orpc.wedding.getTeam.key(),
			orpc.wedding.getSummary.key(),
			orpc.budget.list.key(),
		]) {
			queryClient.invalidateQueries({ queryKey });
		}
	};
}

export function useRequestBooking() {
	const invalidate = useBookingInvalidator();
	return useMutation(
		orpc.booking.request.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success("Request sent to the vendor.");
			},
		}),
	);
}

export function useConfirmBooking() {
	const invalidate = useBookingInvalidator();
	return useMutation(
		orpc.booking.confirm.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success("Booking confirmed.");
			},
		}),
	);
}

export function useCancelBooking() {
	const invalidate = useBookingInvalidator();
	return useMutation(
		orpc.booking.cancel.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success("Booking cancelled.");
			},
		}),
	);
}
