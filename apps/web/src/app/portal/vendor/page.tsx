"use client";

import { Badge } from "@repo/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	InboxIcon,
	type LucideIcon,
	SparklesIcon,
	StarIcon,
	UserSquareIcon,
} from "lucide-react";
import { BaseLayout } from "../../../components/base-layout";
import { useAuth } from "../../../hooks/use-auth";

interface VendorSection {
	title: string;
	description: string;
	icon: LucideIcon;
	status: { label: string; tone: "success" | "info" };
}

const VENDOR_SECTIONS: VendorSection[] = [
	{
		title: "Your profile",
		description:
			"We saved a draft from your setup. Add photos, packages, and publish it soon.",
		icon: UserSquareIcon,
		status: { label: "Draft saved", tone: "success" },
	},
	{
		title: "Portfolio & packages",
		description: "Upload your work and list your services with pricing.",
		icon: SparklesIcon,
		status: { label: "Coming soon", tone: "info" },
	},
	{
		title: "Leads",
		description: "Couples matched to your work will show up here.",
		icon: InboxIcon,
		status: { label: "Coming soon", tone: "info" },
	},
	{
		title: "Reviews",
		description: "Build a verifiable record from couples and fellow vendors.",
		icon: StarIcon,
		status: { label: "Coming soon", tone: "info" },
	},
];

export default function VendorDashboard() {
	const { user } = useAuth();
	const firstName = user?.name?.trim().split(" ")[0] || "there";

	return (
		<BaseLayout
			showBreadcrumb={false}
			title={
				<>
					Welcome, <span className="text-gold">{firstName}</span>
				</>
			}
			description="This is your vendor home. Get your studio ready for couples to discover."
		>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{VENDOR_SECTIONS.map((section) => {
					const Icon = section.icon;
					return (
						<Card key={section.title}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="flex size-8 items-center justify-center rounded-md bg-gold/12 text-gold">
											<Icon className="size-4" />
										</span>
										<CardTitle className="text-base">{section.title}</CardTitle>
									</div>
									<Badge tone={section.status.tone} variant="outline">
										{section.status.label}
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<CardDescription>{section.description}</CardDescription>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</BaseLayout>
	);
}
