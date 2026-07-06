import { ClipboardListIcon, UsersRoundIcon, WalletIcon } from "lucide-react";
import budgetPlanner from "../../../assets/images/landing/budget-planner.jpg";
import { Container, LinkCta, Media } from "../primitives";
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

export function BudgetFeature() {
	return (
		<section className="hairline sec-surface border-b">
			<Container className="grid items-center gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28">
				<Reveal>
					<h2 className="display max-w-[14ch] text-3xl sm:text-4xl md:text-5xl">
						Your budget updates itself.
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
					<Media
						src={budgetPlanner}
						alt="A wedding planning notebook with a checklist and budget"
						ratioClassName="aspect-[5/4]"
						zoom
					/>
				</Reveal>
			</Container>
		</section>
	);
}
