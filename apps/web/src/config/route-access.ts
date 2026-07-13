import type { ActiveMode, Capabilities, UserRole } from "@repo/shared";
import { Roles } from "@repo/shared";

export interface RouteAccessConfig {
	/** Roles allowed on this route. Absent => any authenticated user. */
	allowedRoles?: UserRole[];
	/** Capability required to enter this route (admins bypass). */
	requiredCapability?: ActiveMode;
}

export interface RouteAccessContext {
	role: UserRole | null | undefined;
	capabilities: Capabilities;
}

/**
 * Routes inside /portal/* default to "any authenticated user". List a route
 * here only to restrict it. Dynamic segments use `:paramName` syntax.
 *
 * `requiredCapability` also marks which side of the app a route belongs to —
 * the onboarding guard reads it to decide which onboarding flow to enforce.
 */
export const routeAccessConfig: Record<string, RouteAccessConfig> = {
	// Couple area.
	"/portal": { requiredCapability: "couple" },
	"/portal/budget": { requiredCapability: "couple" },
	"/portal/checklist": { requiredCapability: "couple" },
	"/portal/discover": { requiredCapability: "couple" },
	"/portal/onboarding": { requiredCapability: "couple" },
	"/portal/team": { requiredCapability: "couple" },
	// Vendor area (prefix-matches its sub-routes, e.g. /portal/vendor/onboarding).
	"/portal/vendor": { requiredCapability: "vendor" },
	// Shared account surfaces — reachable in either mode.
	"/portal/messages": {},
	"/portal/profile": {},
	"/portal/about": {},
	// Platform/admin demo surfaces — hidden from couples and vendors.
	"/portal/users": { allowedRoles: [Roles.ADMIN] },
	"/portal/email": { allowedRoles: [Roles.ADMIN] },
	"/portal/storage": { allowedRoles: [Roles.ADMIN] },
	"/portal/colors": { allowedRoles: [Roles.ADMIN] },
	"/portal/typography": { allowedRoles: [Roles.ADMIN] },
	"/portal/components": { allowedRoles: [Roles.ADMIN] },
};

function stripQueryAndHash(pathname: string): string {
	return pathname.split(/[?#]/)[0] ?? pathname;
}

function stripTrailingSlash(pathname: string): string {
	return pathname.length > 1 && pathname.endsWith("/")
		? pathname.slice(0, -1)
		: pathname;
}

/**
 * Match a single route pattern against a pathname.
 *
 * - Same-segment match: each pattern segment matches the path segment, with
 *   `:param` segments treated as wildcards.
 * - Prefix match: a pattern with N segments matches a longer path of N+ segments
 *   when each pattern segment matches the corresponding leading path segment.
 *
 * Prefix matching means `/portal/vendor` matches `/portal/vendor/onboarding`,
 * which closes the silent-fail-open hole where forgetting to enumerate every
 * sub-path would default-allow children of a configured-restricted parent.
 */
function matchRoute(pathname: string, pattern: string): boolean {
	if (pathname === pattern) return true;
	const pathSegments = pathname.split("/").filter(Boolean);
	const patternSegments = pattern.split("/").filter(Boolean);
	if (patternSegments.length > pathSegments.length) return false;
	for (let i = 0; i < patternSegments.length; i++) {
		const p = patternSegments[i];
		const s = pathSegments[i];
		if (p === undefined || s === undefined) return false;
		if (p.startsWith(":")) continue; // dynamic segment matches anything
		if (p !== s) return false;
	}
	return true;
}

/**
 * Find the most specific config key matching `pathname`. Exact matches win
 * over prefix matches; among prefix matches, longer (more segments) wins.
 */
export function findMatchingRoute(pathname: string): string | undefined {
	const clean = stripTrailingSlash(stripQueryAndHash(pathname));

	// Exact match first.
	if (routeAccessConfig[clean]) return clean;

	const keys = Object.keys(routeAccessConfig).sort((a, b) => {
		const aSeg = a.split("/").filter(Boolean).length;
		const bSeg = b.split("/").filter(Boolean).length;
		return bSeg - aSeg;
	});
	for (const key of keys) {
		if (matchRoute(clean, key)) return key;
	}
	return undefined;
}

/** The capability a route belongs to (couple/vendor), or undefined if shared. */
export function routeCapability(pathname: string): ActiveMode | undefined {
	const matched = findMatchingRoute(pathname);
	return matched ? routeAccessConfig[matched]?.requiredCapability : undefined;
}

/**
 * Returns false when the route is restricted and the user lacks the required
 * role or capability; true otherwise. Admins bypass capability gates (but must
 * still satisfy an explicit `allowedRoles` list).
 */
export function isUserAuthorizedForRoute(
	pathname: string,
	ctx: RouteAccessContext,
): boolean {
	const matched = findMatchingRoute(pathname);
	if (!matched) return true;
	const config = routeAccessConfig[matched];
	if (!config) return true;

	const { role, capabilities } = ctx;

	if (config.allowedRoles) {
		if (role == null || !config.allowedRoles.includes(role)) return false;
	}

	if (config.requiredCapability && role !== Roles.ADMIN) {
		if (config.requiredCapability === "vendor" && !capabilities.isVendor) {
			return false;
		}
		if (config.requiredCapability === "couple" && !capabilities.isCouple) {
			return false;
		}
	}

	return true;
}
