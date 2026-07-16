import type { useUser } from "@clerk/nextjs";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";

type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;

const NameSchema = z.object({
	firstName: z.string().trim().min(1, "Enter your first name").max(100),
	lastName: z.string().trim().max(100),
});

function Field({
	label,
	htmlFor,
	optional,
	children,
	error,
}: {
	label: string;
	htmlFor: string;
	optional?: boolean;
	children: React.ReactNode;
	error?: string;
}) {
	return (
		<div className="form-container flex-1">
			<Label htmlFor={htmlFor}>
				{label}
				{optional && <span className="text-muted-foreground"> (optional)</span>}
			</Label>
			{children}
			{error && <p className="invalid-input">{error}</p>}
		</div>
	);
}

function ReadFact({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="min-w-0">
			<dt className="docket text-muted-foreground">{label}</dt>
			<dd className="mt-1 text-foreground text-sm">{children}</dd>
		</div>
	);
}

export function PersonalDetailsForm({
	user,
	email,
	memberSince,
}: {
	user: ClerkUser;
	email: string;
	memberSince: string | null;
}) {
	const form = useForm({
		defaultValues: {
			firstName: user.firstName ?? "",
			lastName: user.lastName ?? "",
		},
		validators: { onChange: NameSchema },
		onSubmit: async ({ value }) => {
			const firstName = value.firstName.trim();
			const lastName = value.lastName.trim();
			try {
				await user.update({ firstName, lastName });
				toast.success("Your details were saved.");
				form.reset({ firstName, lastName });
			} catch {
				toast.error("We couldn't save your details. Please try again.");
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="flex flex-col gap-6"
		>
			<div className="form-row">
				<form.Field
					name="firstName"
					children={(field) => (
						<Field
							label="First name"
							htmlFor="first-name"
							error={
								field.state.meta.isTouched
									? field.state.meta.errors[0]?.message
									: undefined
							}
						>
							<Input
								id="first-name"
								autoComplete="given-name"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								aria-invalid={
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0
								}
							/>
						</Field>
					)}
				/>
				<form.Field
					name="lastName"
					children={(field) => (
						<Field label="Last name" htmlFor="last-name" optional>
							<Input
								id="last-name"
								autoComplete="family-name"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</Field>
					)}
				/>
			</div>

			<dl className="flex flex-wrap gap-x-12 gap-y-4">
				<ReadFact label="Email">
					<span className="mp-mask">{email || "—"}</span>
				</ReadFact>
				<ReadFact label="Member since">
					<span className="docket-num">{memberSince ?? "—"}</span>
				</ReadFact>
			</dl>

			<div className="form-actions">
				<form.Subscribe
					selector={(s) => ({
						canSubmit: s.canSubmit,
						isSubmitting: s.isSubmitting,
						isDirty: s.isDirty,
					})}
					children={({ canSubmit, isSubmitting, isDirty }) => (
						<Button
							type="submit"
							disabled={!canSubmit || isSubmitting || !isDirty}
						>
							{isSubmitting ? "Saving…" : "Save changes"}
						</Button>
					)}
				/>
			</div>
		</form>
	);
}
