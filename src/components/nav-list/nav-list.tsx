// src/components/nav-list/nav-list.tsx
import type { ReactNode } from "react";
import React from "react";
import { formatUnreadCount } from "../../atoms/unread-badge/format-count";
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

/** Colour intent of a {@link NavListItemBadge}, mapped to anker tokens. */
export type NavListBadgeTone = "neutral" | "attention" | "info";

/**
 * A status badge on a nav item: a count bubble, or a dot when `count` is
 * omitted. Unlike the plain `count` it stays visible on the collapsed rail,
 * as a small overlay at the icon's top-right corner.
 */
export interface NavListItemBadge {
	/**
	 * Number (or short string) to show. Omit for a dot. A number above 99
	 * reads `99+`; zero or less renders no badge at all.
	 */
	count?: number | string;
	/** @default "neutral" */
	tone?: NavListBadgeTone;
	/**
	 * What the badge means, e.g. `"3 overdue"` or `"running"`. It is
	 * appended to the item's accessible name ("Tasks, 3 overdue") and to its
	 * tooltip on the rail; the visible badge itself is hidden from assistive
	 * technology.
	 */
	label: string;
}

export interface NavListItemProps {
	icon?: ReactNode;
	/**
	 * A plain quantity shown at the end of the row when expanded (e.g. the
	 * number of entries in a catalog). Hidden on the collapsed rail — use
	 * `badge` for something that needs attention.
	 */
	count?: number | string;
	/** A count bubble or status dot, kept visible on the collapsed rail. */
	badge?: NavListItemBadge;
	active?: boolean;
	asChild?: boolean;
	/** Override tooltip text when the parent is collapsed. */
	label?: string;
	/** data-testid for the root element (non-asChild branch). Defaults to "nav-list-item". */
	testId?: string;
	children: ReactNode;
}

const BADGE_TONES: Record<
	NavListBadgeTone,
	{ subtleBg: string; subtleFg: string; solidBg: string; solidFg: string }
> = {
	neutral: {
		subtleBg: "bg-muted",
		subtleFg: "emphasized",
		solidBg: "muted",
		solidFg: "inverted",
	},
	attention: {
		subtleBg: "secondary.subtle",
		subtleFg: "secondary.fg",
		// secondary.solid (600) with white is ~3.7:1 — too low for the rail's
		// 2xs digits; 700 clears AA in both modes.
		solidBg: "secondary.700",
		solidFg: "secondary.contrast",
	},
	info: {
		subtleBg: "primary.subtle",
		subtleFg: "primary.fg",
		solidBg: "primary.solid",
		solidFg: "primary.contrast",
	},
};

/** The text a badge shows: a string for a count, "" for a dot, null for none. */
function badgeText(badge: NavListItemBadge): string | null {
	if (badge.count === undefined) return "";
	if (typeof badge.count === "number")
		return formatUnreadCount(badge.count, 99);
	return badge.count === "" ? null : badge.count;
}

interface NavBadgeProps {
	text: string;
	tone: NavListBadgeTone;
	placement: "inline" | "rail";
	marginInlineStart?: string;
}

const NavBadge = ({
	text,
	tone,
	placement,
	marginInlineStart,
}: NavBadgeProps) => {
	const colors = BADGE_TONES[tone];
	const isDot = text === "";
	const common = {
		"data-testid": "nav-list-badge",
		"data-tone": tone,
		"data-variant": isDot ? "dot" : "count",
		"data-placement": placement,
		"aria-hidden": true as const,
		flexShrink: 0,
		borderRadius: "full",
	};

	if (placement === "rail") {
		// Overlay at the icon's top-right; the ring in the rail's background
		// colour separates it from the icon underneath.
		return (
			<Box
				{...common}
				position="absolute"
				top={isDot ? "-0.5" : "-1.5"}
				insetInlineEnd={isDot ? "-0.5" : "-2"}
				bg={colors.solidBg}
				color={colors.solidFg}
				boxShadow="0 0 0 2px var(--chakra-colors-bg-canvas)"
				{...(isDot
					? { w: "2", h: "2" }
					: {
							minW: "4",
							h: "4",
							px: "1",
							fontSize: "2xs",
							fontWeight: "semibold",
							lineHeight: "4",
							textAlign: "center" as const,
						})}
				style={{ fontVariantNumeric: "tabular-nums" }}
			>
				{text}
			</Box>
		);
	}

	return (
		<Box
			{...common}
			as="span"
			display="inline-block"
			marginInlineStart={marginInlineStart}
			{...(isDot
				? { w: "2", h: "2", bg: colors.solidBg }
				: {
						minW: "5",
						h: "5",
						px: "1.5",
						fontSize: "xs",
						fontWeight: "medium",
						lineHeight: "5",
						textAlign: "center" as const,
						bg: colors.subtleBg,
						color: colors.subtleFg,
					})}
			style={{ fontVariantNumeric: "tabular-nums" }}
		>
			{text}
		</Box>
	);
};

const NavListItem = ({
	icon,
	count,
	badge,
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

	const shownBadgeText = badge ? badgeText(badge) : null;
	const hasBadge = badge !== undefined && shownBadgeText !== null;
	const badgeTone = badge?.tone ?? "neutral";
	// On the rail the badge overlays the icon; without an icon to anchor to it
	// stays in the row.
	const badgeOnRail = hasBadge && collapsed && Boolean(icon);

	const iconEl = icon ? (
		<Box
			display="inline-flex"
			alignItems="center"
			flexShrink={0}
			position={badgeOnRail ? "relative" : undefined}
		>
			{icon}
			{badgeOnRail && shownBadgeText !== null ? (
				<NavBadge text={shownBadgeText} tone={badgeTone} placement="rail" />
			) : null}
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

	const hasCount = count !== undefined && !collapsed;
	const inlineBadgeEl =
		hasBadge && !badgeOnRail && shownBadgeText !== null ? (
			<NavBadge
				text={shownBadgeText}
				tone={badgeTone}
				placement="inline"
				marginInlineStart={
					hasCount || collapsed ? "var(--chakra-spacing-2)" : "auto"
				}
			/>
		) : null;

	// The active pill is a flex child. When nothing trails the label it gets
	// margin-inline-start: auto (push to end); otherwise the count or badge
	// owns the auto-margin and the pill sits after it with a small gap.
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
						count !== undefined || hasBadge
							? "var(--chakra-spacing-2)"
							: "auto",
				}}
			/>
		) : null;

	const tooltipLabel = label || (typeof children === "string" ? children : "");

	// The badge's meaning, for assistive technology. An asChild link carries
	// it as its aria-label ("Tasks, 3 overdue"), which also keeps the
	// separate text runs of icon, label and badge from being joined with
	// stray spaces. Otherwise — no derivable name, or a plain row — it is
	// visually hidden text: appended to the visible label when expanded,
	// spelled out in full on the rail, where no label text is rendered.
	const asChildProps =
		asChild &&
		React.isValidElement<{ children?: ReactNode; "aria-label"?: string }>(
			children,
		)
			? children.props
			: undefined;
	const asChildText =
		typeof asChildProps?.children === "string" ? asChildProps.children : "";
	// Expanded, the visible text leads the name (label-in-name); on the rail
	// the label prop does, as it does for the tooltip.
	const itemName = collapsed
		? tooltipLabel || asChildText
		: asChildText || tooltipLabel;
	// A plain count shown beside the badge stays in the name, as it was read
	// when it was the row's content.
	const countPart = hasCount ? `, ${count}` : "";
	const badgeName =
		hasBadge && badge && itemName
			? `${itemName}${countPart}, ${badge.label}`
			: undefined;
	// A child's own aria-label already replaces its content as the name, so
	// the meaning is appended to it rather than to hidden text it would mask.
	const childAriaLabel = asChildProps?.["aria-label"];
	const badgeAriaLabel =
		asChild && hasBadge && badge
			? childAriaLabel
				? `${childAriaLabel}, ${badge.label}`
				: badgeName
			: undefined;
	const badgeA11yEl =
		hasBadge && badge && !badgeAriaLabel ? (
			<Box as="span" srOnly>
				{collapsed ? (badgeName ?? badge.label) : `, ${badge.label}`}
			</Box>
		) : null;
	const tooltipText = badgeName ?? tooltipLabel;

	const wrapTooltip = (node: React.ReactElement) =>
		collapsed && tooltipText ? (
			<Tooltip content={tooltipText} positioning={{ placement: "right" }}>
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
				...(badgeAriaLabel ? { "aria-label": badgeAriaLabel } : {}),
				style: {
					...itemStyle,
					...(child.props.style as React.CSSProperties | undefined),
				},
			},
			iconEl,
			collapsed ? null : child.props.children,
			badgeA11yEl,
			countEl,
			inlineBadgeEl,
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
			{badgeA11yEl}
			{countEl}
			{inlineBadgeEl}
			{pillEl}
		</Box>,
	);
};
NavListItem.displayName = "NavList.Item";

export const NavList = Object.assign(NavListRoot, {
	Group: NavListGroup,
	Item: NavListItem,
});
