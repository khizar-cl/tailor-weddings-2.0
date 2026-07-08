import { ClipboardListIcon, UsersRoundIcon, WalletIcon } from "lucide-react";
import { Container, Docket, LinkCta } from "../primitives";
import { Reveal } from "../reveal";

const signUp = { pathname: "/sign-up/" as const, query: { intent: "couple" } };

const budgetPoints = [
	{ icon: WalletIcon, text: "Live totals as you add and confirm" },
	{
		icon: ClipboardListIcon,
		text: "A checklist that fits your date and style",
	},
	{ icon: UsersRoundIcon, text: "Share it all with your partner" },
];

const ledger = [
	{ item: "Venue", amount: "9,500" },
	{ item: "Photography", amount: "4,200" },
	{ item: "Catering", amount: "6,800" },
	{ item: "Florals", amount: "2,100" },
];

export function BudgetFeature() {
	return (
		<section className="hairline sec-surface border-b">
			<Container className="grid items-center gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28">
				<Reveal>
					<h2 className="display max-w-[14ch] text-3xl sm:text-4xl md:text-5xl">
						Your budget, kept to measure.
					</h2>
					<p className="ink-soft mt-5 max-w-md text-lg leading-relaxed">
						Add a vendor to your team and their pricing flows straight into your
						budget. Track every deposit and balance without touching a
						spreadsheet.
					</p>
					<ul className="m-0 mt-7 grid list-none gap-3 p-0">
						{budgetPoints.map(({ icon: Icon, text }) => (
							<li key={text} className="flex items-center gap-3">
								<Icon
									className="size-5 shrink-0 accent-text"
									strokeWidth={1.75}
									aria-hidden
								/>
								<span>{text}</span>
							</li>
						))}
					</ul>
					<div className="mt-8">
						<LinkCta href={signUp}>Plan your wedding</LinkCta>
					</div>
				</Reveal>
				<Reveal delay={120}>
					<div className="swatch swatch-tag p-6 sm:p-8">
						<Docket className="mb-1">Estimate · updated live</Docket>
						<hr className="tick-rule mb-5" aria-hidden />
						<dl className="m-0 grid gap-0">
							{ledger.map(({ item, amount }) => (
								<div
									key={item}
									className="hairline flex items-baseline justify-between border-b py-3"
								>
									<dt className="text-sm">{item}</dt>
									<dd className="docket-num m-0 text-sm">${amount}</dd>
								</div>
							))}
							<div className="flex items-baseline justify-between pt-4">
								<dt className="docket">Est. total</dt>
								<dd className="docket-num m-0 text-2xl accent-text">$22,600</dd>
							</div>
						</dl>
					</div>
				</Reveal>
			</Container>
		</section>
	);
}
