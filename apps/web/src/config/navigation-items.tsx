import type { ActiveMode } from "@repo/shared";
import {
	CompassIcon,
	HardDriveIcon,
	LayoutDashboardIcon,
	ListChecksIcon,
	MailIcon,
	PaletteIcon,
	PanelLeftIcon,
	SquarePenIcon,
	StoreIcon,
	TextIcon,
	UserIcon,
	UsersIcon,
	WalletIcon,
} from "lucide-react";
import type { NavigationItem } from "../components/app-sidebar";

export const coupleNavItems: NavigationItem[] = [
	{ title: "Dashboard", url: "/portal", icon: LayoutDashboardIcon },
	{ title: "Checklist", url: "/portal/checklist", icon: ListChecksIcon },
	{ title: "Discover", url: "/portal/discover", icon: CompassIcon },
	{ title: "Team", url: "/portal/team", icon: UsersIcon },
	{ title: "Budget", url: "/portal/budget", icon: WalletIcon },
	{ title: "Profile", url: "/portal/profile", icon: UserIcon },
];

export const vendorNavItems: NavigationItem[] = [
	{ title: "Dashboard", url: "/portal/vendor", icon: StoreIcon },
	{ title: "Studio", url: "/portal/vendor/profile", icon: SquarePenIcon },
	{ title: "Profile", url: "/portal/profile", icon: UserIcon },
];

/** Platform/admin-only demo surfaces, appended when the user is an admin. */
export const adminNavItems: NavigationItem[] = [
	{
		title: "Platform",
		url: "#",
		icon: PanelLeftIcon,
		items: [
			{ title: "Email", url: "/portal/email", icon: MailIcon },
			{ title: "Storage", url: "/portal/storage", icon: HardDriveIcon },
			{ title: "Users", url: "/portal/users", icon: UsersIcon },
		],
	},
	{
		title: "Design System",
		url: "#",
		icon: PaletteIcon,
		items: [
			{ title: "Colors", url: "/portal/colors", icon: PaletteIcon },
			{ title: "Typography", url: "/portal/typography", icon: TextIcon },
			{ title: "Components", url: "/portal/components", icon: PanelLeftIcon },
		],
	},
];

/** The sidebar set for a given active mode, plus admin extras when applicable. */
export function getNavigationItems(
	activeMode: ActiveMode,
	isAdmin: boolean,
): NavigationItem[] {
	const base = activeMode === "vendor" ? vendorNavItems : coupleNavItems;
	return isAdmin ? [...base, ...adminNavItems] : base;
}

/** Union of every nav entry — used only to build breadcrumb labels. */
export const navigationItems: NavigationItem[] = [
	...coupleNavItems,
	...vendorNavItems,
	...adminNavItems,
];
