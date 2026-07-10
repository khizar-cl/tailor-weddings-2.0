import type { VendorProfileSchema } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "../utils/orpc";

const profileKey = orpc.vendorProfile.get.queryOptions().queryKey;

export function useVendorProfile() {
	return useQuery(orpc.vendorProfile.get.queryOptions());
}

/** Writes a mutation's returned profile straight into the query cache. */
function useProfileCacheWriter() {
	const queryClient = useQueryClient();
	return (data: VendorProfileSchema, message?: string) => {
		queryClient.setQueryData(profileKey, data);
		if (message) toast.success(message);
	};
}

export function useUpdateBusiness() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.updateBusiness.mutationOptions({
			onSuccess: (data) => write(data, "Business details saved"),
		}),
	);
}

export function useUploadLogo() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.uploadLogo.mutationOptions({
			onSuccess: (data) => write(data, "Logo updated"),
		}),
	);
}

export function useAddService() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.addService.mutationOptions({
			onSuccess: (data) => write(data, "Service added"),
		}),
	);
}

export function useUpdateService() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.updateService.mutationOptions({
			onSuccess: (data) => write(data, "Service saved"),
		}),
	);
}

export function useRemoveService() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.removeService.mutationOptions({
			onSuccess: (data) => write(data, "Service removed"),
		}),
	);
}

export function useSetServicePrimary() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.setServicePrimary.mutationOptions({
			onSuccess: (data) => write(data),
		}),
	);
}

export function useSetServicePublish() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.setServicePublish.mutationOptions({
			onSuccess: (data) => write(data),
		}),
	);
}

export function useAddPackage() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.addPackage.mutationOptions({
			onSuccess: (data) => write(data, "Package added"),
		}),
	);
}

export function useUpdatePackage() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.updatePackage.mutationOptions({
			onSuccess: (data) => write(data, "Package saved"),
		}),
	);
}

export function useRemovePackage() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.removePackage.mutationOptions({
			onSuccess: (data) => write(data, "Package removed"),
		}),
	);
}

export function useUploadPortfolio() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.uploadPortfolio.mutationOptions({
			onSuccess: (data) => write(data, "Image uploaded"),
		}),
	);
}

export function useRemovePortfolio() {
	const write = useProfileCacheWriter();
	return useMutation(
		orpc.vendorProfile.removePortfolio.mutationOptions({
			onSuccess: (data) => write(data),
		}),
	);
}
