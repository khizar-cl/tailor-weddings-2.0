"use client";

import type { ActiveMode } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Spinner } from "@repo/ui/components/spinner";
import {
	CheckIcon,
	ChevronsUpDownIcon,
	HeartIcon,
	type LucideIcon,
	PlusIcon,
	StoreIcon,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useAddCapability, useSetActiveMode } from "../api/mode.api";
import { useAuth } from "../hooks/use-auth";

const MODE_META: Record<
	ActiveMode,
	{ label: string; icon: LucideIcon; home: Route }
> = {
	couple: { label: "Planning", icon: HeartIcon, home: "/portal" },
	vendor: { label: "Vendor", icon: StoreIcon, home: "/portal/vendor" },
};

export function ModeSwitcher() {
	const { user } = useAuth();
	const router = useRouter();
	const setActiveMode = useSetActiveMode();
	const addCapability = useAddCapability();

	if (!user) return null;
	const activeUser = user;

	const isBusy = setActiveMode.isPending || addCapability.isPending;
	const current = MODE_META[activeUser.activeMode];
	const CurrentIcon = current.icon;

	function hasCapability(mode: ActiveMode): boolean {
		return mode === "couple"
			? activeUser.capabilities.isCouple
			: activeUser.capabilities.isVendor;
	}

	function goToMode(mode: ActiveMode) {
		if (mode === activeUser.activeMode) return;
		const navigate = () => router.push(MODE_META[mode].home);
		if (hasCapability(mode)) {
			setActiveMode.mutate({ mode }, { onSuccess: navigate });
		} else {
			addCapability.mutate({ capability: mode }, { onSuccess: navigate });
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						tone="secondary"
						variant="outline"
						size="sm"
						disabled={isBusy}
						className="gap-2"
					/>
				}
			>
				{isBusy ? (
					<Spinner className="size-4" />
				) : (
					<CurrentIcon className="size-4 text-gold" />
				)}
				<span>{current.label}</span>
				<ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
					{(["couple", "vendor"] as const).map((mode) => {
						const meta = MODE_META[mode];
						const Icon = meta.icon;
						const active = user.activeMode === mode;
						const owned = hasCapability(mode);
						return (
							<DropdownMenuItem
								key={mode}
								disabled={isBusy || active}
								onClick={() => goToMode(mode)}
							>
								<Icon className="size-4 text-muted-foreground" />
								<span>{meta.label}</span>
								{active ? (
									<CheckIcon className="ml-auto size-4 text-gold" />
								) : owned ? null : (
									<span className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
										<PlusIcon className="size-3" />
										Set up
									</span>
								)}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
