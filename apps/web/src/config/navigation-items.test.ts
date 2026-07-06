import { describe, expect, it } from "vitest";
import {
	adminNavItems,
	coupleNavItems,
	getNavigationItems,
	vendorNavItems,
} from "./navigation-items";

describe("getNavigationItems", () => {
	it("returns the couple set in couple mode", () => {
		expect(getNavigationItems("couple", false)).toEqual(coupleNavItems);
	});

	it("returns the vendor set in vendor mode", () => {
		expect(getNavigationItems("vendor", false)).toEqual(vendorNavItems);
	});

	it("appends admin platform items for admins", () => {
		expect(getNavigationItems("couple", true)).toEqual([
			...coupleNavItems,
			...adminNavItems,
		]);
	});
});
