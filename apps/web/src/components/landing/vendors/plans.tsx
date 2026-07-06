import { Badge } from "@repo/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { CheckIcon } from "lucide-react";
import { Container, LandingButton } from "../primitives";

const signUp = { pathname: "/sign-up/" as const, query: { intent: "vendor" } };

const freePlan = [
	"Your profile, portfolio, and logo",
	"Service packages with pricing",
	"Peer and client reviews",
	"Appear in couple matches",
];

const proPlan = [
	"Everything in the free plan",
	"Priority placement in matches",
	"A featured profile",
	"Deeper reach into your market",
];

export function Plans() {
	return (
		<section className="hairline border-b">
			<Container className="py-20 md:py-28">
				<h2 className="display max-w-[16ch] text-3xl sm:text-4xl md:text-5xl">
					Start free. Upgrade when it pays off.
				</h2>
				<div className="mt-10 grid gap-6 md:grid-cols-2">
					<Card className="h-full">
						<CardHeader>
							<CardTitle className="ink-faint text-base">Free</CardTitle>
							<CardDescription className="display text-2xl text-foreground">
								For getting established
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="m-0 grid list-none gap-3 p-0">
								{freePlan.map((item) => (
									<li key={item} className="flex items-start gap-3">
										<CheckIcon
											className="mt-0.5 size-5 shrink-0 accent-text"
											strokeWidth={2}
											aria-hidden
										/>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</CardContent>
						<CardFooter>
							<LandingButton href={signUp} size="default">
								List your business
							</LandingButton>
						</CardFooter>
					</Card>
					<Card className="h-full border-primary/40 bg-secondary">
						<CardHeader>
							<div className="flex items-center gap-3">
								<CardTitle className="ink-faint text-base">Pro</CardTitle>
								<Badge tone="primary">Coming soon</Badge>
							</div>
							<CardDescription className="display text-2xl text-foreground">
								For growing studios
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="m-0 grid list-none gap-3 p-0">
								{proPlan.map((item) => (
									<li key={item} className="flex items-start gap-3">
										<CheckIcon
											className="mt-0.5 size-5 shrink-0 accent-text"
											strokeWidth={2}
											aria-hidden
										/>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</CardContent>
						<CardFooter>
							<LandingButton href={signUp} variant="secondary" size="default">
								List your business
							</LandingButton>
						</CardFooter>
					</Card>
				</div>
			</Container>
		</section>
	);
}
