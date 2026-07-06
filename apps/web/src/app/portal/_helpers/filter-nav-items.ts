import {
	isUserAuthorizedForRoute,
	type RouteAccessContext,
} from "../../../config/route-access";

interface NavItemLike {
	url: string;
	items?: NavItemLike[];
}

/**
 * Returns a filtered copy of `items` where every entry (and recursively each
 * nested entry's `items[]`) passes `isUserAuthorizedForRoute(item.url, ctx)`.
 *
 * Group headers (URL `"#"`) are kept only if at least one descendant is
 * visible after recursion — otherwise they're dropped to avoid empty groups.
 */
export function filterNavItemsByRole<T extends NavItemLike>(
	items: T[],
	ctx: RouteAccessContext,
): T[] {
	const result: T[] = [];
	for (const item of items) {
		const filteredChildren = item.items
			? filterNavItemsByRole(item.items, ctx)
			: undefined;

		const isGroupHeader = item.url === "#";

		if (isGroupHeader) {
			if (filteredChildren && filteredChildren.length > 0) {
				result.push({ ...item, items: filteredChildren });
			}
			continue;
		}

		if (!isUserAuthorizedForRoute(item.url, ctx)) continue;
		result.push({
			...item,
			...(filteredChildren ? { items: filteredChildren } : {}),
		});
	}
	return result;
}
