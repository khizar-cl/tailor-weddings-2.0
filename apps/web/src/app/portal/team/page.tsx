"use client";

import { Button } from "@repo/ui/components/button";
import { CompassIcon } from "lucide-react";
import Link from "next/link";
import { useUnsaveVendor } from "../../../api/vendor.api";
import { useWeddingTeam } from "../../../api/wedding.api";
import { AppBreadcrumb } from "../../../components/app-breadcrumb";
import Loader from "../../../components/loader";
import { MissingCategories } from "../../../components/team/missing-categories";
import { TeamMemberRow } from "../../../components/team/team-member-row";

export default function TeamPage() {
	const team = useWeddingTeam();
	const unsave = useUnsaveVendor();

	const members = team.data?.members ?? [];
	const missing = team.data?.missingCategories ?? [];

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="mb-4">
				<AppBreadcrumb />
			</div>

			<div className="rise-in">
				<header className="border-border border-b pb-6">
					<span className="docket text-thread-ink">Your vendors</span>
					<div className="mt-2 flex items-end justify-between gap-4">
						<h1 className="font-medium font-serif text-3xl text-foreground sm:text-4xl">
							Wedding team
						</h1>
						{members.length > 0 && (
							<span className="docket-num text-muted-foreground text-sm">
								{members.length} on your team
							</span>
						)}
					</div>
					<p className="mt-2 max-w-md text-muted-foreground text-sm">
						Everyone you've saved or booked, and the categories still waiting to
						be filled.
					</p>
				</header>

				{team.isLoading ? (
					<div className="mt-6">
						<Loader />
					</div>
				) : team.error ? (
					<p className="mt-6 text-destructive-foreground text-sm">
						{team.error.message}
					</p>
				) : (
					<div className="@container mt-6">
						<div className="grid @3xl:grid-cols-[minmax(0,1fr)_18rem] grid-cols-1 gap-10">
							<div>
								{members.length === 0 ? (
									<div className="border border-border border-dashed p-8 text-center">
										<p className="text-muted-foreground text-sm">
											You haven't added any vendors yet.
										</p>
										<Button
											className="mt-4"
											render={<Link href="/portal/discover" />}
										>
											<CompassIcon className="size-4" />
											Discover vendors
										</Button>
									</div>
								) : (
									<ul>
										{members.map((member) => (
											<TeamMemberRow
												key={member.vendorBusinessUuid}
												member={member}
												isRemoving={unsave.isPending}
												onRemove={(vendorBusinessUuid) =>
													unsave.mutate({ vendorBusinessUuid })
												}
											/>
										))}
									</ul>
								)}
							</div>

							<aside className="@3xl:sticky @3xl:top-20 @3xl:self-start">
								<h2 className="text-base">Still to find</h2>
								<div className="mt-4">
									<MissingCategories categories={missing} />
								</div>
							</aside>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
