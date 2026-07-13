import type { SendMessageInputSchema } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

/**
 * Near-real-time without sockets: poll the open thread quickly and the
 * list/badge slowly. `refetchIntervalInBackground` defaults to false, so both
 * pause while the tab is unfocused — no wasted requests when nobody's looking.
 */
const OPEN_THREAD_POLL_MS = 4000;
const THREAD_LIST_POLL_MS = 20000;

export function useThreads() {
	return useQuery({
		...orpc.messaging.listThreads.queryOptions(),
		refetchInterval: THREAD_LIST_POLL_MS,
	});
}

/** Total unread across all threads — drives the sidebar badge. */
export function useUnreadMessageCount() {
	const { data } = useQuery({
		...orpc.messaging.listThreads.queryOptions(),
		refetchInterval: THREAD_LIST_POLL_MS,
		select: (result) =>
			result.items.reduce((total, thread) => total + thread.unreadCount, 0),
	});
	return data ?? 0;
}

export function useThread(conversationUuid: string | null) {
	return useQuery({
		...orpc.messaging.getThread.queryOptions({
			input: { conversationUuid: conversationUuid ?? "" },
		}),
		// Only polls while a thread is open (query is disabled otherwise).
		enabled: conversationUuid !== null,
		refetchInterval: OPEN_THREAD_POLL_MS,
	});
}

export function useStartThread() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.messaging.startThread.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.messaging.listThreads.key(),
				});
			},
		}),
	);
}

export function useSendMessage() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.messaging.sendMessage.mutationOptions({
			onSuccess: (_data, variables: SendMessageInputSchema) => {
				queryClient.invalidateQueries({
					queryKey: orpc.messaging.getThread.queryOptions({
						input: { conversationUuid: variables.conversationUuid },
					}).queryKey,
				});
				queryClient.invalidateQueries({
					queryKey: orpc.messaging.listThreads.key(),
				});
			},
		}),
	);
}

export function useMarkThreadRead() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.messaging.markRead.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.messaging.listThreads.key(),
				});
			},
		}),
	);
}
