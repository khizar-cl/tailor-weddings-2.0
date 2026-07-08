import { getYear } from "date-fns";
import Link from "next/link";
import { Wordmark } from "../wordmark";
import { Container, LandingButton } from "./primitives";

export type Audience = "couple" | "vendor";

const signUp = (intent: Audience) => ({
	pathname: "/sign-up/" as const,
	query: { intent },
});

/**
 * Carry the audience as `intent` into sign-in too, so a visitor who lands on
 * the wrong page (e.g. a vendor who clicks Sign in, then Sign up) keeps their
 * intent through the whole auth flow rather than defaulting to couple.
 */
const signIn = (intent: Audience) => ({
	pathname: "/sign-in/" as const,
	query: { intent },
});

const config = {
	couple: {
		home: "/" as const,
		cross: { href: "/vendors" as const, label: "For professionals" },
		cta: { label: "Plan your wedding", intent: "couple" as const },
	},
	vendor: {
		home: "/vendors" as const,
		cross: { href: "/" as const, label: "For couples" },
		cta: { label: "List your business", intent: "vendor" as const },
	},
};

export function LandingNav({ audience }: { audience: Audience }) {
	const c = config[audience];
	return (
		<header className="hairline sticky top-0 z-40 border-b bg-[color-mix(in_oklab,var(--background)_86%,transparent)] backdrop-blur-md">
			<Container className="flex h-16 items-center justify-between gap-4">
				<Wordmark href={c.home} />
				<nav className="flex items-center gap-1 sm:gap-4">
					<Link
						href={c.cross.href}
						className="ink-soft hidden text-sm transition-colors hover:text-foreground sm:inline"
					>
						{c.cross.label}
					</Link>
					<Link
						href={signIn(c.cta.intent)}
						className="ink-soft hidden text-sm transition-colors hover:text-foreground sm:inline"
					>
						Sign in
					</Link>
					<LandingButton href={signUp(c.cta.intent)} size="sm">
						{c.cta.label}
					</LandingButton>
				</nav>
			</Container>
		</header>
	);
}

export function LandingFooter({ audience }: { audience: Audience }) {
	const c = config[audience];
	const year = getYear(new Date());
	return (
		<footer className="hairline sec-surface border-t">
			<Container className="py-14">
				<div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
					<div>
						<Wordmark href={c.home} />
						<p className="ink-soft mt-4 max-w-xs text-sm leading-relaxed">
							The wedding platform built on verified collaborations, honest
							pricing, and reviews from the people who were actually there.
						</p>
					</div>
					<div>
						<p className="docket mb-4">For couples</p>
						<ul className="m-0 list-none space-y-2 p-0 text-sm">
							<li>
								<Link href="/" className="ink-soft hover:text-foreground">
									Plan your wedding
								</Link>
							</li>
							<li>
								<Link
									href={signIn("couple")}
									className="ink-soft hover:text-foreground"
								>
									Sign in
								</Link>
							</li>
						</ul>
					</div>
					<div>
						<p className="docket mb-4">For professionals</p>
						<ul className="m-0 list-none space-y-2 p-0 text-sm">
							<li>
								<Link
									href="/vendors"
									className="ink-soft hover:text-foreground"
								>
									List your business
								</Link>
							</li>
							<li>
								<Link
									href={signIn("vendor")}
									className="ink-soft hover:text-foreground"
								>
									Sign in
								</Link>
							</li>
						</ul>
					</div>
				</div>
				<hr className="stitch-rule mt-12 opacity-60" aria-hidden />
				<div className="ink-faint mt-6 flex flex-col gap-2 pt-0 text-sm sm:flex-row sm:items-center sm:justify-between">
					<p className="docket m-0 normal-case">
						&copy; {year} Tailor Weddings
					</p>
					<p className="docket m-0">Trusted · Transparent · Tailored</p>
				</div>
			</Container>
		</footer>
	);
}
