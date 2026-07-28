import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "../../primitives";
import { Box, HStack } from "../../primitives/layout";
import { MessageBubble, MessageGroup } from "../message";
import { VirtualizedMessageList } from "./virtualized-message-list";

interface DemoMessage {
	id: string;
	author: string;
	isSelf: boolean;
	sentAt: Date;
	body: string;
}

const AUTHORS = ["Ada Lovelace", "Grace Hopper", "You"];
const SNIPPETS = [
	"Ship it.",
	"Can you look at the release notes when you get a moment?",
	"The fixture conversation renders correctly on my end — dividers, anchoring, the lot. I scrolled through a few hundred messages and it stayed smooth.",
	"👍",
	"I pushed a fix for the flaky test. The problem was a stale scroll offset being reused across renders — classic.",
	"Let's sync tomorrow morning.",
	"That matches what the ADR says: presentation-only, props in, callbacks out.",
];

/**
 * Deterministic fixture: `count` messages ending at `endAt`, spaced ~47min
 * apart so a few dozen messages span multiple local days.
 */
function makeMessages(
	count: number,
	opts: { serialOffset?: number; endAt?: Date } = {},
): DemoMessage[] {
	const { serialOffset = 0, endAt = new Date() } = opts;
	return Array.from({ length: count }, (_, i) => {
		const serial = serialOffset + i;
		const minutesBack = (count - 1 - i) * 47;
		const author = AUTHORS[serial % AUTHORS.length];
		return {
			id: `msg-${serial}`,
			author,
			isSelf: author === "You",
			sentAt: new Date(endAt.getTime() - minutesBack * 60_000),
			body: SNIPPETS[serial % SNIPPETS.length],
		};
	});
}

const formatTime = (date: Date) =>
	date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const renderMessage = (message: DemoMessage) => (
	<Box paddingBlock="1" paddingInline="4">
		<MessageGroup
			author={message.isSelf ? undefined : message.author}
			avatar={
				message.isSelf ? undefined : <Avatar name={message.author} size="xs" />
			}
			isSelf={message.isSelf}
		>
			<MessageBubble timestamp={formatTime(message.sentAt)}>
				{message.body}
			</MessageBubble>
		</MessageGroup>
	</Box>
);

const listProps = {
	getItemKey: (m: DemoMessage) => m.id,
	getItemDate: (m: DemoMessage) => m.sentAt,
	renderItem: renderMessage,
};

/** Bounded-height chat frame — the list fills its container. */
const Frame = ({ children }: { children: React.ReactNode }) => (
	<Box
		height="480px"
		borderWidth="1px"
		borderColor="border"
		borderRadius="lg"
		bg="bg-canvas"
		overflow="hidden"
	>
		{children}
	</Box>
);

const meta = {
	title: "Components/VirtualizedMessageList",
	component: VirtualizedMessageList,
} satisfies Meta<typeof VirtualizedMessageList>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Appends a message on an interval (and on demand) so pinned-to-bottom and
 * scrolled-up-preserves-position behavior can be observed live.
 */
function AppendingHarness({ intervalMs = 2500 }: { intervalMs?: number }) {
	const [items, setItems] = useState(() => makeMessages(40));
	const serialRef = useRef(40);
	const append = useCallback(() => {
		setItems((current) => [
			...current,
			...makeMessages(1, { serialOffset: serialRef.current++ }),
		]);
	}, []);
	useEffect(() => {
		const id = setInterval(append, intervalMs);
		return () => clearInterval(id);
	}, [append, intervalMs]);
	return (
		<Box>
			<HStack marginBlockEnd="2" fontSize="sm" color="muted">
				<span>
					{items.length} messages — one appends every {intervalMs / 1000}s. Stay
					at the bottom to see the list follow; scroll up to see it hold
					position and offer “Jump to latest”.
				</span>
			</HStack>
			<Frame>
				<VirtualizedMessageList items={items} {...listProps} />
			</Frame>
		</Box>
	);
}

/**
 * Serves older pages from a fixed archive when the top is approached —
 * the component only ever fires the callback; the harness owns the data.
 */
function LoadOlderHarness() {
	const PAGE = 40;
	const archiveRef = useRef(makeMessages(400));
	const [start, setStart] = useState(360);
	const [loading, setLoading] = useState(false);
	const loadOlder = useCallback(() => {
		if (loading || start === 0) return;
		setLoading(true);
		setTimeout(() => {
			setStart((s) => Math.max(0, s - PAGE));
			setLoading(false);
		}, 600);
	}, [loading, start]);
	const items = archiveRef.current.slice(start);
	return (
		<Box>
			<HStack marginBlockEnd="2" fontSize="sm" color="muted">
				<span>
					Showing {items.length} of {archiveRef.current.length} — scroll to the
					top to load older pages.
					{loading ? " Loading…" : ""}
				</span>
			</HStack>
			<Frame>
				<VirtualizedMessageList
					items={items}
					{...listProps}
					onLoadOlder={loadOlder}
				/>
			</Frame>
		</Box>
	);
}

export const Default: Story = {
	render: () => (
		<Frame>
			<VirtualizedMessageList items={makeMessages(48)} {...listProps} />
		</Frame>
	),
};

/** Stay at the bottom: appended messages keep the list pinned. */
export const PinnedToBottom: Story = {
	render: () => <AppendingHarness />,
};

/**
 * Starts scrolled up (via play): appended messages no longer move the
 * viewport, and the jump-to-latest pill appears until you return to the
 * bottom.
 */
export const ScrolledUpPreservesPosition: Story = {
	render: () => <AppendingHarness intervalMs={2000} />,
	play: async ({ canvasElement }) => {
		const viewport = canvasElement.querySelector<HTMLElement>(
			'[data-testid="message-list-viewport"]',
		);
		if (!viewport) return;
		viewport.scrollTop -= 600;
		// Programmatic scrollTop changes may not fire a scroll event before the
		// next append lands — dispatch one so the upward move registers now.
		viewport.dispatchEvent(new Event("scroll"));
	},
};

/** Multi-day fixture: a divider renders at every local-day boundary. */
export const DayDividers: Story = {
	render: () => (
		<Frame>
			<VirtualizedMessageList items={makeMessages(160)} {...listProps} />
		</Frame>
	),
};

/** 1200 messages stay smooth — only the visible window is rendered. */
export const LargeList: Story = {
	render: () => (
		<Frame>
			<VirtualizedMessageList items={makeMessages(1200)} {...listProps} />
		</Frame>
	),
};

/** Approaching the top fires onLoadOlder; the consumer prepends a page. */
export const LoadOlderPages: Story = {
	render: () => <LoadOlderHarness />,
};

/** Without getItemDate the list renders no dividers. */
export const WithoutDayDividers: Story = {
	render: () => (
		<Frame>
			<VirtualizedMessageList
				items={makeMessages(48)}
				{...listProps}
				getItemDate={undefined}
			/>
		</Frame>
	),
};
