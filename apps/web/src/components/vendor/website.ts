/** A vendor-entered website may omit the scheme; ensure it's a usable href. */
export function websiteHref(website: string) {
	return website.startsWith("http") ? website : `https://${website}`;
}
