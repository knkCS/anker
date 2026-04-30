// src/components/toolbar.tsx
import { Search } from "lucide-react";
import type React from "react";
import { Box, Flex } from "../primitives/layout";
import { Text } from "../primitives/typography";

// Root
const ToolbarRoot = ({ children }: { children: React.ReactNode }) => (
	<Flex
		data-testid="toolbar"
		align="center"
		gap="4"
		px="4"
		h="48px"
		bg="bg-subtle"
		borderBottomWidth="1px"
		borderBottomColor="border"
	>
		{children}
	</Flex>
);
ToolbarRoot.displayName = "Toolbar";

// Search
export interface ToolbarSearchProps {
	placeholder?: string;
	value: string;
	onChange: (next: string) => void;
}

const ToolbarSearch = ({
	placeholder,
	value,
	onChange,
}: ToolbarSearchProps) => (
	<Flex align="center" gap="2" w="260px" position="relative">
		<Box position="absolute" left="2" color="muted" pointerEvents="none">
			<Search size={14} />
		</Box>
		<input
			type="text"
			placeholder={placeholder}
			value={value}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
				onChange(e.target.value)
			}
			style={{
				height: "32px",
				paddingLeft: "2rem",
				paddingRight: "0.5rem",
				width: "100%",
				borderWidth: "1px",
				borderStyle: "solid",
				borderRadius: "var(--chakra-radii-md)",
				fontSize: "var(--chakra-font-sizes-sm)",
				background: "var(--chakra-colors-bg-surface, white)",
				outline: "none",
			}}
		/>
	</Flex>
);
ToolbarSearch.displayName = "Toolbar.Search";

// Filters
const ToolbarFilters = ({ children }: { children: React.ReactNode }) => (
	<Flex align="center" gap="2">
		{children}
	</Flex>
);
ToolbarFilters.displayName = "Toolbar.Filters";

// FilterChip
export interface ToolbarFilterChipProps {
	icon?: React.ReactNode;
	active?: boolean;
	onClick: () => void;
	children: React.ReactNode;
}

const ToolbarFilterChip = ({
	icon,
	active,
	onClick,
	children,
}: ToolbarFilterChipProps) => (
	<button
		type="button"
		data-testid="filter-chip"
		data-active={active ? "true" : "false"}
		onClick={onClick}
		style={{
			display: "inline-flex",
			alignItems: "center",
			gap: "4px",
			padding: "0 10px",
			height: "28px",
			fontSize: "var(--chakra-font-sizes-xs)",
			fontWeight: "var(--chakra-font-weights-medium)",
			borderWidth: "1px",
			borderStyle: "solid",
			borderRadius: "var(--chakra-radii-md)",
			cursor: "pointer",
		}}
	>
		{icon && (
			<Box display="inline-flex" alignItems="center">
				{icon}
			</Box>
		)}
		{children}
	</button>
);
ToolbarFilterChip.displayName = "Toolbar.FilterChip";

// Right slot
const ToolbarRight = ({ children }: { children: React.ReactNode }) => (
	<Flex align="center" gap="2" ml="auto">
		{children}
	</Flex>
);
ToolbarRight.displayName = "Toolbar.Right";

// Count
const ToolbarCount = ({ children }: { children: React.ReactNode }) => (
	<Text fontSize="xs" color="muted">
		{children}
	</Text>
);
ToolbarCount.displayName = "Toolbar.Count";

// Compose
export const Toolbar = Object.assign(ToolbarRoot, {
	Search: ToolbarSearch,
	Filters: ToolbarFilters,
	FilterChip: ToolbarFilterChip,
	Right: ToolbarRight,
	Count: ToolbarCount,
});
