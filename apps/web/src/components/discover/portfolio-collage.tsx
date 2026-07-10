"use client";

import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@repo/ui/components/carousel";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog";
import { cn } from "@repo/ui/lib/utils";
import { useEffect, useState } from "react";

interface PortfolioImage {
	uuid: string;
	url: string | null;
	caption: string | null;
}

function Tile({
	image,
	className,
	label,
	overlay,
	onOpen,
}: {
	image: PortfolioImage;
	className?: string;
	label?: string;
	overlay?: number;
	onOpen: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onOpen}
			className={cn("group relative overflow-hidden bg-secondary", className)}
		>
			{image.url && (
				// biome-ignore lint/performance/noImgElement: presigned S3 URL has a dynamic host/expiry, unsuited to next/image
				<img
					src={image.url}
					alt={image.caption ?? ""}
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					loading="lazy"
				/>
			)}
			{label && (
				<span className="absolute bottom-3 left-3 font-medium text-background text-sm drop-shadow">
					{label}
				</span>
			)}
			{overlay ? (
				<span className="absolute inset-0 flex items-center justify-center bg-foreground/55 font-medium text-background">
					+{overlay} more
				</span>
			) : null}
		</button>
	);
}

// Tile placement per visible-count, mirroring a hero + strip collage.
const LAYOUT: Record<number, { grid: string; tiles: string[] }> = {
	1: { grid: "grid-cols-1", tiles: [""] },
	2: { grid: "grid-cols-2", tiles: ["", ""] },
	3: {
		grid: "grid-cols-3 grid-rows-2",
		tiles: ["col-span-2 row-span-2", "col-span-1", "col-span-1"],
	},
	4: {
		grid: "grid-cols-4 grid-rows-2",
		tiles: [
			"col-span-2 row-span-2",
			"col-span-1 row-span-2",
			"col-span-1",
			"col-span-1",
		],
	},
};

export function PortfolioCollage({ images }: { images: PortfolioImage[] }) {
	const shots = images.filter((image) => image.url);
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);

	useEffect(() => {
		if (!api) return;
		setCurrent(api.selectedScrollSnap());
		const onSelect = () => setCurrent(api.selectedScrollSnap());
		api.on("select", onSelect);
		return () => {
			api.off("select", onSelect);
		};
	}, [api]);

	if (shots.length === 0) return null;

	const n = shots.length;
	const visibleCount = Math.min(n, 4);
	const layout = LAYOUT[visibleCount] ?? LAYOUT[4];
	const tiles = shots.slice(0, visibleCount);
	const extra = n > 4 ? n - 4 : 0;

	return (
		<>
			<div className={cn("grid h-60 gap-1 sm:h-72", layout?.grid)}>
				{tiles.map((image, index) => (
					<Tile
						key={image.uuid}
						image={image}
						className={layout?.tiles[index]}
						label={index === 0 ? "Portfolio" : undefined}
						overlay={index === visibleCount - 1 ? extra : 0}
						onOpen={() => setOpenIndex(index)}
					/>
				))}
			</div>

			<Dialog
				open={openIndex !== null}
				onOpenChange={(o) => !o && setOpenIndex(null)}
			>
				<DialogContent className="max-w-3xl">
					<DialogTitle className="sr-only">Portfolio</DialogTitle>
					{openIndex !== null && (
						<Carousel
							className="w-full"
							setApi={setApi}
							opts={{ startIndex: openIndex, loop: n > 1 }}
						>
							<CarouselContent>
								{shots.map((image) => (
									<CarouselItem key={image.uuid}>
										<div className="flex items-center justify-center bg-secondary">
											{image.url && (
												// biome-ignore lint/performance/noImgElement: presigned S3 URL has a dynamic host/expiry, unsuited to next/image
												<img
													src={image.url}
													alt={image.caption ?? ""}
													className="max-h-[70vh] w-full object-contain"
												/>
											)}
										</div>
										{image.caption && (
											<p className="mt-2 text-center text-muted-foreground text-sm">
												{image.caption}
											</p>
										)}
									</CarouselItem>
								))}
							</CarouselContent>
							{n > 1 && (
								<>
									<CarouselPrevious className="left-3" />
									<CarouselNext className="right-3" />
									<div className="mt-3 flex flex-wrap justify-center gap-1.5">
										{shots.map((image, index) => (
											<button
												key={image.uuid}
												type="button"
												aria-label={`Go to image ${index + 1}`}
												aria-current={index === current}
												onClick={() => api?.scrollTo(index)}
												className={cn(
													"size-1.5 rounded-full transition-colors",
													index === current
														? "bg-primary"
														: "bg-border hover:bg-muted-foreground",
												)}
											/>
										))}
									</div>
								</>
							)}
						</Carousel>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
