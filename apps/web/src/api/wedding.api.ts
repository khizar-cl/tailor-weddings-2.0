import { useQuery } from "@tanstack/react-query";
import { orpc } from "../utils/orpc";

export function useWeddingSummary() {
	return useQuery(orpc.wedding.getSummary.queryOptions());
}

export function useWeddingTeam() {
	return useQuery(orpc.wedding.getTeam.queryOptions());
}
