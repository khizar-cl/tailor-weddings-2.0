import {
	Building2,
	Cake,
	Camera,
	ClipboardList,
	Flower2,
	type LucideIcon,
	Music,
	Sparkles,
	Utensils,
	Video,
} from "lucide-react";

/**
 * Best-effort icon for a vendor category, keyed off its name.
 * TODO: move the category→icon mapping to the database.
 */
export function categoryIcon(name: string | null): LucideIcon {
	const n = (name ?? "").toLowerCase();
	if (n.includes("photo")) return Camera;
	if (n.includes("video") || n.includes("film")) return Video;
	if (n.includes("floral") || n.includes("flower")) return Flower2;
	if (n.includes("cater")) return Utensils;
	if (n.includes("music") || n.includes("dj") || n.includes("band"))
		return Music;
	if (n.includes("venue")) return Building2;
	if (n.includes("cake") || n.includes("dessert")) return Cake;
	if (n.includes("plan")) return ClipboardList;
	return Sparkles;
}
