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
