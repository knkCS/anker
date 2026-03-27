import { Plus } from "lucide-react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { TextInput } from "../../atoms/text-input";
import { Box, Flex, Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";

export interface InlineCreatableListProps<T> {
	items: T[];
	activeIds?: string[];
	onToggle?: (id: string) => void;
	onCreate?: (name: string) => Promise<void>;
	getItemId: (item: T) => string;
	getItemLabel: (item: T) => string;
	getItemColor?: (item: T) => string | undefined;
	/** @default "wrap" */
	variant?: "wrap" | "list";
	/** @default "New item..." */
	createPlaceholder?: string;
	/** @default "New item" */
	createLabel?: string;
	/** @default <Plus size={14} /> */
	createIcon?: React.ReactNode;
	/** @default "No items" */
	emptyText?: string;
	disabled?: boolean;
}

function InlineCreatableListInner<T>(props: InlineCreatableListProps<T>) {
	const {
		items,
		activeIds = [],
		onToggle,
		onCreate,
		getItemId,
		getItemLabel,
		getItemColor,
		variant = "wrap",
		createPlaceholder = "New item...",
		createLabel = "New item",
		createIcon = <Plus size={14} />,
		emptyText = "No items",
		disabled = false,
	} = props;

	const [isCreating, setIsCreating] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isCreating) {
			inputRef.current?.focus();
		}
	}, [isCreating]);

	const activeIdSet = new Set(activeIds);

	const handleSubmit = async (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) {
			setIsCreating(false);
			return;
		}
		setIsSubmitting(true);
		try {
			await onCreate?.(trimmed);
			setIsCreating(false);
		} catch {
			// Stay in create mode on error
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSubmit((e.target as HTMLInputElement).value);
		} else if (e.key === "Escape") {
			setIsCreating(false);
		}
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const value = e.target.value.trim();
		if (value) {
			handleSubmit(value);
		} else {
			setIsCreating(false);
		}
	};

	const wrapItemBaseStyle: React.CSSProperties = {
		borderRadius: "6px",
		paddingInline: "12px",
		paddingBlock: "4px",
		fontSize: "0.875rem",
		cursor: "pointer",
		transition: "all 0.15s",
		border: "none",
		lineHeight: 1.5,
	};

	const listItemBaseStyle: React.CSSProperties = {
		paddingInline: "8px",
		paddingBlock: "6px",
		borderRadius: "6px",
		cursor: "pointer",
		fontSize: "0.875rem",
		transition: "all 0.15s",
		border: "none",
		textAlign: "start",
		width: "100%",
		display: "block",
	};

	const disabledStyle: React.CSSProperties = disabled
		? { opacity: 0.5, cursor: "not-allowed" }
		: {};

	const renderWrapItems = () =>
		items.map((item) => {
			const id = getItemId(item);
			const label = getItemLabel(item);
			const color = getItemColor?.(item);
			const isActive = activeIdSet.has(id);

			let bgStyle: string;
			let colorStyle: string;

			if (isActive) {
				bgStyle = color ? `${color}33` : "var(--chakra-colors-primary-subtle)";
				colorStyle = color ?? "var(--chakra-colors-primary-fg)";
			} else {
				bgStyle = "var(--chakra-colors-bg-muted)";
				colorStyle = "var(--chakra-colors-fg-default)";
			}

			return (
				<Box
					key={id}
					as="button"
					rounded="md"
					px={3}
					py={1}
					fontSize="sm"
					cursor={disabled ? "not-allowed" : "pointer"}
					transition="all 0.15s"
					opacity={disabled ? 0.5 : 1}
					style={{
						...wrapItemBaseStyle,
						...disabledStyle,
						background: bgStyle,
						color: colorStyle,
					}}
					onClick={!disabled ? () => onToggle?.(id) : undefined}
				>
					{label}
				</Box>
			);
		});

	const renderListItems = () =>
		items.map((item) => {
			const id = getItemId(item);
			const label = getItemLabel(item);
			const isActive = activeIdSet.has(id);

			const bgStyle = isActive
				? "var(--chakra-colors-primary-subtle)"
				: "transparent";
			const colorStyle = isActive
				? "var(--chakra-colors-primary-fg)"
				: "var(--chakra-colors-fg-default)";

			return (
				<Box
					key={id}
					as="button"
					px={2}
					py={1.5}
					rounded="md"
					cursor={disabled ? "not-allowed" : "pointer"}
					fontSize="sm"
					opacity={disabled ? 0.5 : 1}
					_hover={{ bg: isActive ? "primary.subtle" : "bg.subtle" }}
					style={{
						...listItemBaseStyle,
						...disabledStyle,
						background: bgStyle,
						color: colorStyle,
					}}
					onClick={!disabled ? () => onToggle?.(id) : undefined}
				>
					{label}
				</Box>
			);
		});

	const showEmpty = items.length === 0 && !isCreating;
	const showCreateLink = !!onCreate && !isCreating && !disabled;

	return (
		<Box>
			{variant === "wrap" ? (
				<Flex wrap="wrap" gap={2}>
					{showEmpty && (
						<Text fontSize="sm" color="fg.muted">
							{emptyText}
						</Text>
					)}
					{renderWrapItems()}
				</Flex>
			) : (
				<Stack gap={0}>
					{showEmpty && (
						<Text fontSize="sm" color="fg.muted" px={2} py={1.5}>
							{emptyText}
						</Text>
					)}
					{renderListItems()}
				</Stack>
			)}

			{showCreateLink && (
				<button
					type="button"
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "4px",
						cursor: "pointer",
						fontSize: "0.875rem",
						color: "var(--chakra-colors-fg-muted)",
						marginBlockStart: items.length > 0 ? "8px" : "4px",
						border: "none",
						background: "transparent",
						padding: 0,
					}}
					onClick={() => setIsCreating(true)}
				>
					{createIcon}
					<span>{createLabel}</span>
				</button>
			)}

			{isCreating && (
				<Box mt={items.length > 0 ? 2 : 1}>
					<TextInput
						ref={inputRef}
						size="sm"
						placeholder={createPlaceholder}
						disabled={isSubmitting}
						onKeyDown={handleKeyDown}
						onBlur={handleBlur}
					/>
				</Box>
			)}
		</Box>
	);
}

export const InlineCreatableList = InlineCreatableListInner as <T>(
	props: InlineCreatableListProps<T>,
) => React.ReactElement;
(InlineCreatableList as { displayName?: string }).displayName =
	"InlineCreatableList";
