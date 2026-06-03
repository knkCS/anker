// src/components/nav-list/nav-list.tsx
import type { ReactNode } from "react";
import React from "react";
import { Box, Flex } from "../../primitives/layout";
import { Tooltip } from "../../primitives/tooltip";
import { Text } from "../../primitives/typography";
import { useNavListMode } from "./nav-list-context";

export interface NavListProps {
	"aria-label"?: string;
	children: ReactNode;
}

const NavListRoot = ({ children, ...rest }: NavListProps) => (
	<Box as="nav" aria-label={rest["aria-label"]}>
		{children}
	</Box>
);
NavListRoot.displayName = "NavList";

export interface NavListGroupProps {
	label?: string;
	children: ReactNode;
}

const NavListGroup = ({ label, children }: NavListGroupProps) => {
	const { collapsed } = useNavListMode();
	return (
		<Box mb="2" px="2">
			{label && !collapsed && (
				<Text
					fontSize="2xs"
					fontWeight="semibold"
					letterSpacing="wider"
					textTransform="uppercase"
					color="subtle"
					px="2"
					pt="2"
					pb="1"
				>
					{label}
				</Text>
			)}
			<Flex direction="column" gap="2" data-testid="nav-list-group-items">
				{children}
			</Flex>
		</Box>
	);
};
NavListGroup.displayName = "NavList.Group";

export interface NavListItemProps {
	icon?: ReactNode;
	count?: number | string;
	active?: boolean;
	asChild?: boolean;
	/** Override tooltip text when the parent is collapsed. */
	label?: string;
	/** data-testid for the root element (non-asChild branch). Defaults to "nav-list-item". */
	testId?: string;
	children: ReactNode;
}

const NavListItem = ({
	icon,
	count,
	active,
	asChild,
	label,
	testId = "nav-list-item",
	children,
}: NavListItemProps) => {
	const { collapsed } = useNavListMode();

	const itemStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		justifyContent: collapsed ? "center" : "flex-start",
		gap: "var(--chakra-spacing-2)",
		paddingInline: "var(--chakra-spacing-3)",
		paddingBlock: "var(--chakra-spacing-3)",
		borderRadius: "var(--chakra-radii-sm)",
		fontSize: "var(--chakra-font-sizes-sm)",
		fontWeight: active
			? "var(--chakra-font-weights-medium)"
			: "var(--chakra-font-weights-normal)",
		color: active
			? "var(--chakra-colors-primary-700)"
			: "var(--chakra-colors-default)",
		background: active ? "var(--chakra-colors-bg-surface)" : "transparent",
		boxShadow: active
			? "inset 0 0 0 1px var(--chakra-colors-border), 0 1px 2px rgba(0,0,0,0.04)"
			: undefined,
		position: "relative",
		textDecoration: "none",
		cursor: "pointer",
	};

	const iconEl = icon ? (
		<Box display="inline-flex" alignItems="center" flexShrink={0}>
			{icon}
		</Box>
	) : null;

	const countEl =
		count !== undefined && !collapsed ? (
			<Text
				as="span"
				fontSize="xs"
				color={active ? "primary.700" : "subtle"}
				flexShrink={0}
				marginInlineStart="auto"
				style={{ fontVariantNumeric: "tabular-nums" }}
			>
				{count}
			</Text>
		) : null;

	// The active pill is a flex child. When there's no count it gets
	// margin-inline-start: auto (push to end); when there IS a count the
	// count owns the auto-margin and the pill sits after it with a small gap.
	const pillEl =
		active && !collapsed ? (
			<span
				aria-hidden="true"
				style={{
					width: 3,
					height: 14,
					background: "var(--chakra-colors-primary-700)",
					borderRadius: 999,
					flexShrink: 0,
					marginInlineStart:
						count !== undefined ? "var(--chakra-spacing-2)" : "auto",
				}}
			/>
		) : null;

	const tooltipLabel = label || (typeof children === "string" ? children : "");

	const wrapTooltip = (node: React.ReactElement) =>
		collapsed && tooltipLabel ? (
			<Tooltip content={tooltipLabel} positioning={{ placement: "right" }}>
				{node}
			</Tooltip>
		) : (
			node
		);

	if (asChild) {
		const child = React.Children.only(children) as React.ReactElement<
			React.HTMLAttributes<HTMLElement> & {
				"data-active"?: string;
				children?: ReactNode;
			}
		>;
		const cloned = React.cloneElement(
			child,
			{
				"data-active": active ? "true" : "false",
				"aria-current": active ? "page" : undefined,
				style: {
					...itemStyle,
					...(child.props.style as React.CSSProperties | undefined),
				},
			},
			iconEl,
			collapsed ? null : child.props.children,
			countEl,
			pillEl,
		);
		return wrapTooltip(cloned);
	}

	return wrapTooltip(
		<Box
			data-testid={testId}
			data-active={active ? "true" : "false"}
			aria-current={active ? "page" : undefined}
			style={itemStyle}
		>
			{iconEl}
			{!collapsed && children}
			{countEl}
			{pillEl}
		</Box>,
	);
};
NavListItem.displayName = "NavList.Item";

export const NavList = Object.assign(NavListRoot, {
	Group: NavListGroup,
	Item: NavListItem,
});
