import type { PriceUnit } from "@repo/shared";

const usd = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

export function formatCents(cents: number) {
	return usd.format(Math.round(cents / 100));
}

const UNIT_SUFFIX: Record<PriceUnit, string> = {
	flat: "",
	hourly: "/hr",
	per_guest: "/guest",
};

export function formatPrice(cents: number, unit: PriceUnit) {
	return `${formatCents(cents)}${UNIT_SUFFIX[unit]}`;
}

/** Human labels for the price-unit select in the vendor editor. */
export const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
	flat: "Flat rate",
	hourly: "Per hour",
	per_guest: "Per guest",
};

export const PRICE_UNITS: PriceUnit[] = ["flat", "hourly", "per_guest"];

/** Dollars string (e.g. "2500") → integer cents, or undefined when blank. */
export function dollarsToCents(value: string): number | undefined {
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	const dollars = Number(trimmed);
	if (Number.isNaN(dollars) || dollars < 0) return undefined;
	return Math.round(dollars * 100);
}

/** Integer cents → editable dollars string (no currency symbol). */
export function centsToDollars(cents: number | null): string {
	return cents === null ? "" : String(Math.round(cents / 100));
}
