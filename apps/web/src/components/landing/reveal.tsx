"use client";

import { type ElementType, type ReactNode, useEffect, useRef } from "react";

type RevealProps = {
	children: ReactNode;
	/** Stagger offset in ms, applied via CSS custom property. */
	delay?: number;
	as?: ElementType;
	className?: string;
};

/**
 * Reveals its children with a rise-and-fade when they scroll into view.
 * Uses IntersectionObserver (never a scroll listener) and self-disables under
 * reduced-motion so the content is simply visible from the start.
 */
export function Reveal({
	children,
	delay = 0,
	as: Tag = "div",
	className,
}: RevealProps) {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (prefersReduced) {
			node.classList.add("is-in");
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-in");
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<Tag
			ref={ref}
			className={className ? `reveal ${className}` : "reveal"}
			style={delay ? { ["--reveal-delay" as string]: `${delay}ms` } : undefined}
		>
			{children}
		</Tag>
	);
}
