"use client";

import { buttonVariants } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonVariants = NonNullable<Parameters<typeof buttonVariants>[0]>;

type LinkButtonProps = ButtonVariants & {
	href: ComponentProps<typeof Link>["href"];
	className?: string;
	children: ComponentProps<typeof Link>["children"];
};

/**
 * A Next.js Link styled as a button. Lives here (client) because `buttonVariants`
 * is a client export and can't be called from a server component — this lets
 * server-rendered pages keep their `metadata` export while still using the
 * design-system button styling for navigation CTAs.
 */
export function LinkButton({
	href,
	className,
	children,
	...variants
}: LinkButtonProps) {
	return (
		<Link href={href} className={cn(buttonVariants(variants), className)}>
			{children}
		</Link>
	);
}
