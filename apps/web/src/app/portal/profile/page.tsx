"use client";

import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@repo/ui/components/skeleton";
import { format } from "date-fns";
import { AccountMasthead } from "../../../components/account/account-masthead";
import { PersonalDetailsForm } from "../../../components/account/personal-details-form";
import { AppBreadcrumb } from "../../../components/app-breadcrumb";
import { useAuth } from "../../../hooks/use-auth";

function ProfileSkeleton() {
	return (
		<div className="flex flex-col gap-10">
			<Skeleton className="h-28 w-full" />
			<div className="grid gap-8 md:grid-cols-5 md:gap-10">
				<Skeleton className="h-24 w-full md:col-span-2" />
				<Skeleton className="h-48 w-full md:col-span-3" />
			</div>
		</div>
	);
}

export default function ProfilePage() {
	const { user: clerkUser, isLoaded } = useUser();
	const { user: authUser } = useAuth();

	const memberSince = clerkUser?.createdAt
		? format(new Date(clerkUser.createdAt), "MMMM d, yyyy")
		: null;
	const name =
		clerkUser?.fullName ||
		[clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
		"Your account";

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			{!isLoaded ? (
				<ProfileSkeleton />
			) : !clerkUser ? (
				<p className="text-muted-foreground text-sm">
					Sign in to view your profile.
				</p>
			) : (
				<div className="@container rise-in flex flex-col gap-10">
					<AccountMasthead
						name={name}
						imageUrl={clerkUser.imageUrl}
						isAdmin={authUser?.role === "admin"}
					/>
					<div className="grid @3xl:grid-cols-5 @3xl:gap-10 gap-8">
						<div className="@3xl:col-span-2">
							<span className="docket text-thread-ink">Personal details</span>
							<p className="mt-3 max-w-xs text-muted-foreground text-sm">
								Update how your name appears across Tailor Weddings.
							</p>
						</div>
						<div className="@3xl:col-span-3">
							<PersonalDetailsForm
								user={clerkUser}
								email={clerkUser.primaryEmailAddress?.emailAddress ?? ""}
								memberSince={memberSince}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
