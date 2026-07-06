import { Button } from "@repo/ui/components/button";
import { ArrowRightIcon, Flower2Icon } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Href = ComponentProps<typeof Link>["href"];
type ButtonSize = ComponentProps<typeof Button>["size"];

/** Container: single max width for the whole marketing surface. */
export function Container({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={`mx-auto w-[min(1240px,calc(100%-2.5rem))] ${className}`}>
			{children}
		</div>
	);
}

type LandingButtonVariant = "primary" | "secondary";

/**
 * Marketing CTA. Wraps the shared shadcn Button (so it uses the global theme)
 * and renders it as a Next.js Link. On the evergreen emphasis band, pass
 * `onForest` to switch the primary fill to the amber accent for contrast.
 */
export function LandingButton({
	href,
	children,
	variant = "primary",
	size = "lg",
	onForest = false,
	className = "",
}: {
	href: Href;
	children: ReactNode;
	variant?: LandingButtonVariant;
	size?: ButtonSize;
	onForest?: boolean;
	className?: string;
}) {
	if (variant === "secondary") {
		return (
			<Button
				variant="outline"
				size={size}
				nativeButton={false}
				className={`${
					onForest
						? "border-emphasis-foreground/40 text-emphasis-foreground hover:bg-emphasis-foreground/10 hover:text-emphasis-foreground"
						: ""
				} ${className}`}
				render={<Link href={href} />}
			>
				{children}
			</Button>
		);
	}
	return (
		<Button
			size={size}
			nativeButton={false}
			className={`${
				onForest
					? "bg-gold text-gold-foreground hover:bg-gold hover:shadow-[inset_0_0_0_100px_rgba(0,0,0,0.12)]"
					: ""
			} ${className}`}
			render={<Link href={href} />}
		>
			{children}
		</Button>
	);
}

/** Underlined text link with a nudging arrow. */
export function LinkCta({
	href,
	children,
	className = "",
}: {
	href: Href;
	children: ReactNode;
	className?: string;
}) {
	return (
		<Link href={href} className={`link-cta ${className}`}>
			{children}
			<ArrowRightIcon className="link-arrow size-4" aria-hidden />
		</Link>
	);
}

export function Eyebrow({ children }: { children: ReactNode }) {
	return <p className="eyebrow mb-4">{children}</p>;
}

/**
 * Topical photography. Images are bundled static assets (see
 * src/assets/images/landing) so placements never depend on a live external
 * host that can break. Pass the imported image module as `src`; its intrinsic
 * dimensions drive optimization and the blur placeholder.
 */
export function Media({
	src,
	alt,
	className = "",
	ratioClassName = "",
	priority = false,
	zoom = false,
}: {
	src: StaticImageData;
	alt: string;
	className?: string;
	/** Aspect-ratio utility applied to the wrapper, e.g. "aspect-[4/5]". */
	ratioClassName?: string;
	priority?: boolean;
	zoom?: boolean;
}) {
	return (
		<div
			className={`media ${zoom ? "media-zoom" : ""} ${ratioClassName} ${className}`}
		>
			<Image
				src={src}
				alt={alt}
				placeholder="blur"
				priority={priority}
				sizes="(max-width: 768px) 100vw, 50vw"
			/>
		</div>
	);
}

/** One kinetic marquee per page. Track is duplicated for a seamless loop. */
export function Marquee({ items }: { items: string[] }) {
	const track = (
		<ul className="marquee__track m-0 list-none p-0" aria-hidden>
			{items.map((item, i) => (
				<li
					key={`${item}-${i}`}
					className="display flex items-center gap-3.5 text-2xl md:text-3xl"
				>
					{item}
					<Flower2Icon
						className="size-4 shrink-0 accent-text"
						strokeWidth={1.75}
						aria-hidden
					/>
				</li>
			))}
		</ul>
	);
	return (
		<div className="marquee py-1">
			{track}
			{track}
		</div>
	);
}
