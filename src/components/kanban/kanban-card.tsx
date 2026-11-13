// Kanban.Card and the card building blocks (title, meta line, badges, avatar
// slot). The card reads its place on the board — roving tabindex, the arrow
// keys, its ref — from `KanbanCardSlotContext`, which `<Kanban>` provides
// around every card it renders. On an editable board the slot also carries
// the drag wiring (`drag`): the pointer listeners, the keyboard
// instructions, and whether the card is picked up. Outside a board the card
// is a plain card.
import type React from "react";
import { createContext, useContext } from "react";
import { Box, type BoxProps, HStack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import type { KanbanCardDrag } from "./kanban-dnd-types";

/**
 * How loudly a card speaks:
 * - `default` — the plain surface.
 * - `quiet` — nobody needs to act: the sunken canvas surface behind a dashed
 *   border. Text keeps full strength, so it reads calm, not disabled.
 * - `attention` — someone must act: a `warning` edge on the inline start.
 */
export const KANBAN_CARD_TONES = ["default", "quiet", "attention"] as const;

export type KanbanCardTone = (typeof KANBAN_CARD_TONES)[number];

/** What `<Kanban>` hands the card it wraps, so the board can steer focus. */
export interface KanbanCardSlot {
	tabIndex: number;
	ref: (element: HTMLElement | null) => void;
	onFocus: () => void;
	onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
	/** Set on an editable board (`onMove`). */
	drag?: KanbanCardDrag;
}

export const KanbanCardSlotContext = createContext<KanbanCardSlot | null>(null);

const TONE_STYLES: Record<KanbanCardTone, BoxProps> = {
	default: { bg: "bg-surface", borderStyle: "solid", borderColor: "border" },
	quiet: {
		bg: "bg-canvas",
		borderStyle: "dashed",
		// `border` all but vanishes on the sunken surface in dark mode.
		borderColor: "border-emphasized",
	},
	attention: {
		bg: "bg-surface",
		borderStyle: "solid",
		borderColor: "border",
		borderInlineStartWidth: "4px",
		borderInlineStartColor: "warning.solid",
	},
};

export interface KanbanCardProps
	extends Omit<React.HTMLAttributes<HTMLElement>, "color"> {
	/** How loudly the card speaks. @default "default" */
	tone?: KanbanCardTone;
	/** Makes the card a link (`<a>`) to the item's detail. */
	href?: string;
	target?: string;
	rel?: string;
	/**
	 * Without `href`, makes the card a `<button>` that opens the item. With
	 * neither, the card is static (still reachable with the arrow keys).
	 */
	onClick?: React.MouseEventHandler<HTMLElement>;
	/**
	 * Render the single child element as the card — e.g. a router `<Link>` —
	 * merging the card's styles, focus handling and props onto it.
	 */
	asChild?: boolean;
	children?: React.ReactNode;
}

// A picked-up card (keyboard) is outlined in the accent colour and lifted; the
// card a pointer drags leaves a dashed accent outline in its place.
const GRABBED_STYLES: BoxProps = {
	borderStyle: "solid",
	borderColor: "accent",
	boxShadow: "lg",
};
const DRAGGING_STYLES: BoxProps = {
	borderStyle: "dashed",
	borderColor: "accent",
	opacity: 0.5,
};

/** The drag listeners merged with the consumer's handlers of the same name. */
function dragHandlers(
	drag: KanbanCardDrag | undefined,
	rest: Record<string, unknown>,
): Record<string, (event: never) => void> {
	const merged: Record<string, (event: never) => void> = {};
	for (const [name, listener] of Object.entries(drag?.listeners ?? {})) {
		const own = rest[name] as ((event: never) => void) | undefined;
		merged[name] = (event) => {
			own?.(event);
			listener(event);
		};
	}
	return merged;
}

export function KanbanCard(props: KanbanCardProps) {
	const { tone = "default", href, onClick, asChild, children, ...rest } = props;
	const slot = useContext(KanbanCardSlotContext);
	const drag = slot?.drag;
	const interactive = asChild || href != null || onClick != null;
	const element = href != null ? "a" : onClick != null ? "button" : "div";
	// `Box` types its props as a div's; the element's own attributes go in
	// untyped.
	const elementProps: Record<string, unknown> = asChild
		? { href }
		: element === "a"
			? { href }
			: element === "button"
				? { type: "button" }
				: {};

	return (
		<Box
			as={asChild ? undefined : element}
			asChild={asChild}
			{...elementProps}
			onClick={onClick}
			data-kanban-card=""
			data-tone={tone}
			display="flex"
			flexDirection="column"
			gap="2"
			width="full"
			p="3"
			borderRadius="md"
			borderWidth="1px"
			color="default"
			textAlign="start"
			textDecoration="none"
			transitionProperty="common"
			transitionDuration="normal"
			_focusVisible={{ outline: "none", boxShadow: "focus-ring" }}
			{...(interactive
				? { cursor: "pointer", _hover: { boxShadow: "sm" } }
				: undefined)}
			{...TONE_STYLES[tone]}
			{...(drag
				? {
						cursor: "grab",
						"data-draggable": "",
						"data-grabbed": drag.grabbed ? "" : undefined,
						"data-dragging": drag.dragging ? "" : undefined,
						...(drag.grabbed ? GRABBED_STYLES : undefined),
						...(drag.dragging ? DRAGGING_STYLES : undefined),
					}
				: undefined)}
			{...rest}
			{...dragHandlers(drag, rest)}
			aria-describedby={
				[rest["aria-describedby"], drag?.describedBy]
					.filter(Boolean)
					.join(" ") || undefined
			}
			tabIndex={slot?.tabIndex ?? rest.tabIndex}
			ref={slot?.ref}
			onFocus={(event: React.FocusEvent<HTMLElement>) => {
				slot?.onFocus();
				rest.onFocus?.(event);
			}}
			onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
				slot?.onKeyDown(event);
				rest.onKeyDown?.(event);
			}}
		>
			{children}
		</Box>
	);
}
KanbanCard.displayName = "Kanban.Card";

export interface KanbanCardTitleProps {
	children?: React.ReactNode;
}

/** The card's title: medium weight, at most two lines. */
export function KanbanCardTitle({ children }: KanbanCardTitleProps) {
	return (
		<Text fontSize="sm" fontWeight="medium" color="default" lineClamp={2}>
			{children}
		</Text>
	);
}
KanbanCardTitle.displayName = "Kanban.CardTitle";

export interface KanbanCardMetaProps {
	children?: React.ReactNode;
}

/**
 * The card's meta line — a reference, an owner, a date — small and muted.
 * Put a `Kanban.CardAvatar` inside to pin an avatar to its end.
 */
export function KanbanCardMeta({ children }: KanbanCardMetaProps) {
	return (
		<HStack gap="2" fontSize="xs" color="muted" minW="0">
			{children}
		</HStack>
	);
}
KanbanCardMeta.displayName = "Kanban.CardMeta";

export interface KanbanCardBadgesProps {
	children?: React.ReactNode;
}

/** A wrapping row of badges (`StatusBadge`, `Badge`). */
export function KanbanCardBadges({ children }: KanbanCardBadgesProps) {
	return (
		<HStack gap="1.5" wrap="wrap">
			{children}
		</HStack>
	);
}
KanbanCardBadges.displayName = "Kanban.CardBadges";

export interface KanbanCardAvatarProps {
	children?: React.ReactNode;
}

/** The avatar slot: pinned to the inline end of the row it sits in. */
export function KanbanCardAvatar({ children }: KanbanCardAvatarProps) {
	return (
		<Box marginInlineStart="auto" flexShrink={0} display="inline-flex">
			{children}
		</Box>
	);
}
KanbanCardAvatar.displayName = "Kanban.CardAvatar";
