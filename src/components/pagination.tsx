import { Button, HStack, IconButton, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";

export interface PaginationProps {
	/** Current page (1-based). */
	page: number;
	/** Total number of items. */
	total: number;
	/** Items per page. @default 10 */
	pageSize?: number;
	/** Called when the page changes. */
	onPageChange: (page: number) => void;
	/** Maximum page buttons to show. @default 5 */
	maxVisiblePages?: number;
	/** Label for the previous button. @default "Previous page" */
	previousLabel?: string;
	/** Label for the next button. @default "Next page" */
	nextLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = (props) => {
	const {
		page,
		total,
		pageSize = 10,
		onPageChange,
		maxVisiblePages = 5,
		previousLabel = "Previous page",
		nextLabel = "Next page",
	} = props;

	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const currentPage = Math.min(Math.max(1, page), totalPages);

	const pages = getVisiblePages(currentPage, totalPages, maxVisiblePages);

	return (
		<HStack gap={1}>
			<IconButton
				variant="ghost"
				size="sm"
				aria-label={previousLabel}
				disabled={currentPage <= 1}
				onClick={() => onPageChange(currentPage - 1)}
			>
				<ChevronLeft size={16} />
			</IconButton>
			{pages.map((p) =>
				p === "ellipsis-start" || p === "ellipsis-end" ? (
					<Text key={p} px={2} color="muted" fontSize="sm">
						…
					</Text>
				) : (
					<Button
						key={p}
						variant={p === currentPage ? "solid" : "ghost"}
						colorPalette={p === currentPage ? "primary" : undefined}
						size="sm"
						minW="36px"
						onClick={() => onPageChange(p)}
						aria-current={p === currentPage ? "page" : undefined}
					>
						{p}
					</Button>
				),
			)}
			<IconButton
				variant="ghost"
				size="sm"
				aria-label={nextLabel}
				disabled={currentPage >= totalPages}
				onClick={() => onPageChange(currentPage + 1)}
			>
				<ChevronRight size={16} />
			</IconButton>
		</HStack>
	);
};

Pagination.displayName = "Pagination";

function getVisiblePages(
	current: number,
	total: number,
	max: number,
): Array<number | "ellipsis-start" | "ellipsis-end"> {
	if (total <= max) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}

	const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = [];
	const half = Math.floor((max - 2) / 2);
	let start = Math.max(2, current - half);
	let end = Math.min(total - 1, current + half);

	if (current - half <= 2) {
		end = Math.min(total - 1, max - 1);
	}
	if (current + half >= total - 1) {
		start = Math.max(2, total - max + 2);
	}

	pages.push(1);
	if (start > 2) pages.push("ellipsis-start");
	for (let i = start; i <= end; i++) {
		pages.push(i);
	}
	if (end < total - 1) pages.push("ellipsis-end");
	pages.push(total);

	return pages;
}
