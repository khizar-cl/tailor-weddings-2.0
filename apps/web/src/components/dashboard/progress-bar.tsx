export function ProgressBar({ pct }: { pct: number }) {
	return (
		<div className="h-1.5 w-full overflow-hidden rounded-sm bg-muted">
			<div
				className="h-full rounded-sm bg-primary"
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}
