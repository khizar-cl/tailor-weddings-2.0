"use client";

import { useClerk, useAuth as useClerkAuth } from "@clerk/nextjs";
import { Spinner } from "@repo/ui/components/spinner";
import { useIsMobile } from "@repo/ui/hooks/use-mobile";
import type { Route } from "next";
import { redirect, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useUnreadMessageCount } from "../../api/messaging.api";
import { AppHeader } from "../../components/app-header";
import { AppSidebar } from "../../components/app-sidebar";
import { getNavigationItems } from "../../config/navigation-items";
import {
	isUserAuthorizedForRoute,
	type RouteAccessContext,
	routeCapability,
} from "../../config/route-access";
import { type AuthUser, useAuth } from "../../hooks/use-auth";
import { AuthProvider } from "../../providers/auth-provider";
import { BreadcrumbProvider } from "../../providers/breadcrumb-provider";
import {
	SidebarControlProvider,
	useSidebarControl,
} from "../../providers/sidebar-control-provider";
import { AnalyticsEvent, analytics } from "../../utils/analytics";
import { filterNavItemsByRole } from "./_helpers/filter-nav-items";

const ONBOARDING_ROUTES = ["/portal/onboarding", "/portal/vendor/onboarding"];

/** Where a user belongs when their current route isn't reachable. */
function homeForUser(user: AuthUser): Route {
	if (user.activeMode === "vendor" && user.capabilities.isVendor) {
		return "/portal/vendor";
	}
	if (user.capabilities.isCouple) return "/portal";
	if (user.capabilities.isVendor) return "/portal/vendor";
	return "/portal";
}

function PortalContent({
	children,
	user,
}: {
	children: React.ReactNode;
	user: AuthUser;
}) {
	const { isPermanentlyExpanded, handleManualToggle } = useSidebarControl();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const isMobile = useIsMobile();

	const sidebarEffectivelyOpen = sidebarOpen || isPermanentlyExpanded;
	// On mobile the sidebar is an overlay above content — no margin reserved.
	const contentOffset = isMobile
		? "ml-0"
		: sidebarEffectivelyOpen
			? "ml-60"
			: "ml-14";
	const showBackdrop = isMobile === true && sidebarEffectivelyOpen;

	useEffect(() => {
		if (!showBackdrop) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleManualToggle();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [showBackdrop, handleManualToggle]);

	useEffect(() => {
		if (!showBackdrop) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [showBackdrop]);

	const unreadMessages = useUnreadMessageCount();
	const ctx: RouteAccessContext = {
		role: user.role,
		capabilities: user.capabilities,
	};
	const visibleNav = filterNavItemsByRole(
		getNavigationItems(user.activeMode, user.role === "admin"),
		ctx,
	).map((item) =>
		item.url === "/portal/messages"
			? { ...item, badgeCount: unreadMessages }
			: item,
	);

	return (
		<>
			{showBackdrop && (
				<button
					type="button"
					aria-label="Close sidebar"
					onClick={handleManualToggle}
					className="fixed inset-0 z-40 bg-overlay"
				/>
			)}
			<AppSidebar
				navigationItems={visibleNav}
				isOpen={sidebarOpen}
				onOpenChange={setSidebarOpen}
			/>
			<div
				className={`flex min-h-screen flex-col transition-[margin] duration-200 ${contentOffset}`}
			>
				<AppHeader />
				<main className="flex-1" inert={showBackdrop || undefined}>
					{children}
				</main>
			</div>
		</>
	);
}

function PortalErrorScreen({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-center">
			<p className="text-lg">We couldn't load your account.</p>
			<p className="text-muted-foreground text-sm">
				Please try again. If the problem persists, sign out and back in.
			</p>
			<button
				type="button"
				onClick={onRetry}
				className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
			>
				Retry
			</button>
		</div>
	);
}

function PortalRoleGuard({ children }: { children: React.ReactNode }) {
	const { user, isLoading, isError, error, refetch } = useAuth();
	const { signOut } = useClerk();
	const pathname = usePathname();

	const errorCode = (error as { code?: string } | null)?.code;
	const isAuthError = isError && errorCode === "UNAUTHORIZED";

	useEffect(() => {
		if (isAuthError) {
			analytics.track(AnalyticsEvent.SIGN_OUT, {
				reason: "auth_error_occurred",
			});
			void signOut({ redirectUrl: "/" });
		}
	}, [isAuthError, signOut]);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (isAuthError) {
		// Sign-out is in progress (kicked off by the effect above);
		// render a spinner so we don't flash the error screen.
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (isError) {
		return (
			<PortalErrorScreen
				onRetry={() => {
					void refetch();
				}}
			/>
		);
	}

	if (!user) return null;

	const ctx: RouteAccessContext = {
		role: user.role,
		capabilities: user.capabilities,
	};

	if (!isUserAuthorizedForRoute(pathname, ctx)) {
		const home = homeForUser(user);
		// Avoid a redirect loop if the user isn't allowed on their own home.
		redirect(pathname === home ? "/" : home);
	}

	// Enforce onboarding once per capability area. Admins bypass; shared pages
	// (profile/about) and admin surfaces have no capability, so they're exempt.
	if (user.role !== "admin") {
		const areaCapability = routeCapability(pathname);
		if (areaCapability) {
			const completed =
				areaCapability === "vendor"
					? user.onboarding.vendor
					: user.onboarding.couple;
			const onboardingRoute: Route =
				areaCapability === "vendor"
					? "/portal/vendor/onboarding"
					: "/portal/onboarding";
			if (!completed && pathname !== onboardingRoute) {
				redirect(onboardingRoute);
			}
		}
	}

	// Onboarding is a focused, full-screen flow — render it without the sidebar
	// and header chrome (but still behind the auth + capability guards above).
	if (ONBOARDING_ROUTES.includes(pathname)) {
		return <>{children}</>;
	}

	return <PortalContent user={user}>{children}</PortalContent>;
}

export default function PortalLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isSignedIn, isLoaded } = useClerkAuth();

	if (isLoaded && !isSignedIn) {
		redirect("/sign-in");
	}

	if (!isLoaded) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<AuthProvider>
			<SidebarControlProvider>
				<BreadcrumbProvider>
					<PortalRoleGuard>{children}</PortalRoleGuard>
				</BreadcrumbProvider>
			</SidebarControlProvider>
		</AuthProvider>
	);
}
