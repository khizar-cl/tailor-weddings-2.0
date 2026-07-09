export function PanelHeader({
	title,
	trailing,
}: {
	title: string;
	trailing?: React.ReactNode;
}) {
	return (
		<div className="flex items-end justify-between gap-4 border-border border-b pb-3">
			<h2 className="text-xl">{title}</h2>
			{trailing}
		</div>
	);
}
