import { getYear } from "date-fns";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "../components/link-button";
import { SignedInRedirect } from "../components/signed-in-redirect";

export const metadata: Metadata = {
	title: "Tailor Weddings — the wedding team you can trust",
	description:
		"Tailor connects couples with wedding professionals who are vouched for by the people they work beside. Verified collaborations, transparent pricing, and your whole team in one place.",
};

const coupleIntent = { pathname: "/sign-up/", query: { intent: "couple" } };
const vendorIntent = { pathname: "/sign-up/", query: { intent: "vendor" } };

const categories = [
	"Photography",
	"Videography",
	"Florals",
	"Planning",
	"Catering",
	"Venues",
	"Music & DJ",
	"Beauty",
];

const steps = [
	{
		title: "Tell us about your day",
		description:
			"Your date, budget, guest count, and style — a few questions, no account maze.",
	},
	{
		title: "Get a tailored plan",
		description:
			"A personalized checklist, a starter budget, and vendors matched to your style and price range.",
	},
	{
		title: "Build your team",
		description:
			"Save favorites, book with confidence, and manage everyone from one dashboard through to the day itself.",
	},
];

function SiteHeader() {
	return (
		<header className="sticky top-0 z-10 border-border border-b bg-background/80 backdrop-blur-md">
			<div className="page-wrap flex h-16 items-center justify-between">
				<Link
					href={{ pathname: "/" }}
					className="text-lg tracking-tight"
					aria-label="Tailor Weddings home"
				>
					<span className="font-semibold font-serif text-foreground">
						Tailor
					</span>{" "}
					<span className="text-muted-foreground">Weddings</span>
				</Link>
				<nav className="flex items-center gap-2">
					<LinkButton
						href={{ pathname: "/sign-in/" }}
						variant="ghost"
						size="sm"
						className="hidden sm:inline-flex"
					>
						Sign in
					</LinkButton>
					<LinkButton href={coupleIntent} size="sm">
						Get started
					</LinkButton>
				</nav>
			</div>
		</header>
	);
}

function Hero() {
	return (
		<section className="brand-backdrop border-border border-b">
			<div className="page-wrap grid items-end gap-12 py-20 md:grid-cols-12 md:gap-8 md:py-28">
				<div className="md:col-span-8">
					<p className="section-label mb-6 text-gold">
						The wedding platform built on trust
					</p>
					<h1 className="max-w-[14ch] text-balance text-5xl leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
						Build a wedding team you can actually trust.
					</h1>
					<p className="mt-7 max-w-xl text-lg text-muted-foreground">
						Verified collaborations, transparent pricing, and no fake reviews —
						for the couples planning the day and the professionals making it
						happen.
					</p>
					<div className="mt-9 flex flex-col gap-3 sm:flex-row">
						<LinkButton href={coupleIntent} size="lg">
							Plan your wedding
							<ArrowRightIcon className="size-4" />
						</LinkButton>
						<LinkButton href={vendorIntent} variant="outline" size="lg">
							List your business
						</LinkButton>
					</div>
				</div>
				<aside className="md:col-span-3 md:col-start-10">
					<p className="section-label mb-1">On Tailor</p>
					<ul className="m-0 list-none p-0">
						{categories.map((category) => (
							<li
								key={category}
								className="flex items-center justify-between border-border border-b py-2.5 text-sm"
							>
								<span className="text-foreground">{category}</span>
								<span aria-hidden className="text-gold">
									—
								</span>
							</li>
						))}
					</ul>
				</aside>
			</div>
		</section>
	);
}

function TrustStatement() {
	return (
		<section className="page-wrap grid gap-8 py-20 md:grid-cols-12 md:py-28">
			<p className="m-0 max-w-[16ch] font-serif text-3xl leading-tight tracking-tight sm:text-4xl md:col-span-8 md:text-5xl">
				Reviews from the people who were{" "}
				<span className="text-gold">actually there.</span>
			</p>
			<p className="m-0 self-end text-muted-foreground md:col-span-3 md:col-start-10">
				Planners, florists, and photographers review the professionals they
				worked beside — tied to real events. No anonymous ratings, no gaming the
				score.
			</p>
		</section>
	);
}

function DualPaths() {
	return (
		<section className="border-border border-y bg-muted/30">
			<div className="page-wrap grid md:grid-cols-2">
				<div className="border-border border-b py-16 md:border-r md:border-b-0 md:py-24 md:pr-14">
					<p className="section-label mb-4 text-gold">For couples</p>
					<h2 className="mb-4 text-3xl sm:text-4xl">
						Plan without the guesswork.
					</h2>
					<p className="mb-7 max-w-md text-muted-foreground">
						Answer a few questions and get a tailored checklist, a starter
						budget, and vendors matched to your style — then manage your whole
						team in one place.
					</p>
					<LinkButton href={coupleIntent} variant="link" className="px-0">
						Start planning
						<ArrowRightIcon className="size-4" />
					</LinkButton>
				</div>
				<div className="py-16 md:py-24 md:pl-14">
					<p className="section-label mb-4 text-gold">For professionals</p>
					<h2 className="mb-4 text-3xl sm:text-4xl">
						Grow on your reputation.
					</h2>
					<p className="mb-7 max-w-md text-muted-foreground">
						Show your work, publish real pricing, and earn peer reviews from the
						vendors you collaborate with. Meet couples who fit your style — not
						your spam folder.
					</p>
					<LinkButton href={vendorIntent} variant="link" className="px-0">
						List your business
						<ArrowRightIcon className="size-4" />
					</LinkButton>
				</div>
			</div>
		</section>
	);
}

function HowItWorks() {
	return (
		<section className="page-wrap py-20 md:py-28">
			<div className="mb-12 grid gap-4 md:grid-cols-12">
				<p className="section-label text-gold md:col-span-3">How it works</p>
				<h2 className="m-0 max-w-[18ch] text-3xl sm:text-4xl md:col-span-9">
					From overwhelmed to organized, in three steps.
				</h2>
			</div>
			<ol className="m-0 list-none p-0">
				{steps.map((step, i) => (
					<li
						key={step.title}
						className="grid items-baseline gap-2 border-border border-t py-8 md:grid-cols-12 md:gap-6"
					>
						<span className="display-title text-4xl text-gold tabular-nums md:col-span-2 md:text-5xl">
							{String(i + 1).padStart(2, "0")}
						</span>
						<h3 className="m-0 text-xl md:col-span-4">{step.title}</h3>
						<p className="m-0 text-muted-foreground md:col-span-6">
							{step.description}
						</p>
					</li>
				))}
				<li className="border-border border-t" />
			</ol>
		</section>
	);
}

function ClosingCta() {
	return (
		<section className="brand-backdrop border-border border-t">
			<div className="page-wrap grid items-end gap-8 py-20 md:grid-cols-12 md:py-28">
				<h2 className="m-0 max-w-[14ch] text-4xl leading-[1.05] tracking-tight sm:text-5xl md:col-span-8">
					Find the people who'll make your day.
				</h2>
				<div className="flex flex-col gap-3 md:col-span-4 md:items-end">
					<LinkButton href={coupleIntent} size="lg">
						Plan your wedding
						<ArrowRightIcon className="size-4" />
					</LinkButton>
					<LinkButton href={vendorIntent} variant="outline" size="lg">
						List your business
					</LinkButton>
				</div>
			</div>
		</section>
	);
}

function SiteFooter({ year }: { year: number }) {
	return (
		<footer className="border-border border-t">
			<div className="page-wrap flex flex-col items-center justify-between gap-3 py-8 text-center sm:flex-row sm:text-left">
				<p className="m-0 text-muted-foreground text-sm">
					&copy; {year} Tailor Weddings. All rights reserved.
				</p>
				<p className="section-label m-0">Trusted · Transparent · Tailored</p>
			</div>
		</footer>
	);
}

export default function LandingPage() {
	const year = getYear(new Date());

	return (
		<>
			<SignedInRedirect />
			<div className="flex min-h-screen flex-col bg-background">
				<SiteHeader />
				<main className="flex-1">
					<Hero />
					<TrustStatement />
					<DualPaths />
					<HowItWorks />
					<ClosingCta />
				</main>
				<SiteFooter year={year} />
			</div>
		</>
	);
}
