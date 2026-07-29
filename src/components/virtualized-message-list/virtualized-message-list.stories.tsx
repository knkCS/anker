import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../atoms";
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
	// data-message-id lets a play function re-find one specific message after a
	// prepend has shifted every row index — the id is the only stable handle.
	<Box paddingBlock="1" paddingInline="4" data-message-id={message.id}>
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
 * Tolerance for the scroll assertions below. Row heights are measured after the
 * first paint and browsers report fractional scroll offsets, so exact equality
 * is unreliable; 4px is an order of magnitude below one message row, so a real
 * jump still fails.
 */
const TOLERANCE_PX = 4;

/** Lets React commit and the virtualizer measure before the next assertion. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

function assert(condition: boolean, message: string): asserts condition {
	if (!condition) throw new Error(`VirtualizedMessageList: ${message}`);
}

/**
 * Retries `assertion` until it passes, then rethrows its last failure once the
 * timeout elapses — @testing-library's `waitFor` contract, written locally so
 * these stories stay dependency-free like the rest of the repo's play
 * functions.
 */
async function waitFor(assertion: () => void, timeoutMs = 2000) {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		try {
			assertion();
			return;
		} catch (error) {
			if (Date.now() >= deadline) throw error;
			await tick();
		}
	}
}

/**
 * The scroll container: the component renders its viewport as the `role="log"`
 * region — the same element ScrolledUpPreservesPosition reaches for by
 * data-testid.
 */
function getViewport(canvasElement: HTMLElement): HTMLElement {
	const viewport = canvasElement.querySelector<HTMLElement>('[role="log"]');
	assert(viewport !== null, 'no role="log" scroll container rendered');
	return viewport;
}

/** How far the bottom of the content sits below the bottom of the viewport. */
const distanceFromBottom = (viewport: HTMLElement) =>
	viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;

/** Asserts the viewport rests at the very bottom of an overflowing list. */
function assertRestingAtBottom(viewport: HTMLElement) {
	assert(
		viewport.scrollHeight > viewport.clientHeight + TOLERANCE_PX,
		"the fixture does not overflow the frame, so a bottom check would pass trivially",
	);
	const gap = distanceFromBottom(viewport);
	assert(
		gap <= TOLERANCE_PX,
		`expected the list to rest at the bottom, but it sits ${Math.round(gap)}px above it`,
	);
}

/** Where an element's top edge sits relative to the viewport's top edge. */
const offsetWithinViewport = (element: HTMLElement, viewport: HTMLElement) =>
	element.getBoundingClientRect().top - viewport.getBoundingClientRect().top;

/**
 * The topmost message fully inside the viewport, plus where it sits — the
 * fixed point a prepend must not move.
 */
function anchorMessage(viewport: HTMLElement) {
	const element = Array.from(
		viewport.querySelectorAll<HTMLElement>("[data-message-id]"),
	).find((candidate) => offsetWithinViewport(candidate, viewport) >= 0);
	assert(element !== undefined, "no message is fully inside the viewport");
	const id = element.dataset.messageId;
	assert(id !== undefined, "the anchored message carries no id");
	return { id, offset: offsetWithinViewport(element, viewport) };
}

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

/** Older serials waiting above the first page, and the size of one page. */
const PREPEND_ARCHIVE = 400;
const PREPEND_PAGE = 40;
const PREPEND_VISIBLE = 60;
/** The spacing `makeMessages` puts between items — an older page continues it. */
const MESSAGE_SPACING_MS = 47 * 60_000;
/** Fixed clock: the fixture is byte-identical on every run of the play. */
const PREPEND_END_AT = new Date("2026-01-15T12:00:00");

/**
 * Prepends a page of older messages on demand. The button stands in for the
 * consumer's fetch — LoadOlderPages shows the real `onLoadOlder` wiring; here
 * the trigger is explicit so the play function is not racing a scroll-driven
 * callback.
 */
function PrependHarness() {
	const [{ items, offset }, setState] = useState(() => ({
		offset: PREPEND_ARCHIVE,
		items: makeMessages(PREPEND_VISIBLE, {
			serialOffset: PREPEND_ARCHIVE,
			endAt: PREPEND_END_AT,
		}),
	}));
	const prependOlder = useCallback(() => {
		setState((current) => {
			if (current.offset === 0) return current;
			const nextOffset = Math.max(0, current.offset - PREPEND_PAGE);
			const older = makeMessages(current.offset - nextOffset, {
				serialOffset: nextOffset,
				endAt: new Date(current.items[0].sentAt.getTime() - MESSAGE_SPACING_MS),
			});
			return { offset: nextOffset, items: [...older, ...current.items] };
		});
	}, []);
	return (
		<Box>
			<HStack marginBlockEnd="2" fontSize="sm" color="muted">
				<span>
					Showing {items.length} messages, {offset} older still archived. Scroll
					up, then prepend — the message you were reading stays put.
				</span>
				<Button
					size="xs"
					variant="outline"
					data-testid="prepend-older"
					disabled={offset === 0}
					onClick={prependOlder}
				>
					Prepend older page
				</Button>
			</HStack>
			<Frame>
				<VirtualizedMessageList items={items} {...listProps} />
			</Frame>
		</Box>
	);
}

/** 48 messages in a bounded frame — day dividers, grouping, and anchoring. */
export const Default: Story = {
	render: () => (
		<Frame>
			<VirtualizedMessageList items={makeMessages(48)} {...listProps} />
		</Frame>
	),
};

/**
 * Reverse scroll — the behaviour the component exists for. `items` stay in
 * their natural **oldest → newest** order (nothing is reversed in the data),
 * the newest message renders at the **bottom** of the frame, and the list
 * mounts already **scrolled to the bottom**: a reader starts at the latest
 * message and scrolls **up** into history, the way every chat client behaves.
 *
 * The play function pins it rather than leaving it to the eye: on mount the
 * `role="log"` scroll container's `scrollTop + clientHeight` is within 4px of
 * its `scrollHeight`, and the last message element in the DOM is the last item
 * in `items`.
 */
export const ReverseScroll: Story = {
	render: () => (
		<Frame>
			<VirtualizedMessageList items={makeMessages(48)} {...listProps} />
		</Frame>
	),
	play: async ({ canvasElement }) => {
		const viewport = getViewport(canvasElement);
		// Rows are measured after the first paint, so the anchored offset settles
		// a frame or two in — poll rather than assert on tick zero.
		await waitFor(() => {
			assertRestingAtBottom(viewport);
		});
		// Newest at the bottom: the last item of the fixture (msg-47) is the last
		// message rendered, and it is the one the mounted viewport is resting on.
		const rendered =
			viewport.querySelectorAll<HTMLElement>("[data-message-id]");
		const newest = rendered[rendered.length - 1];
		assert(
			newest?.dataset.messageId === "msg-47",
			`expected the newest message (msg-47) to render last, got ${newest?.dataset.messageId ?? "nothing"}`,
		);
	},
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

/**
 * Prepend anchoring — the hard half of scroll anchoring. Older history is
 * inserted **above** what you are reading, which grows the scroll content:
 * without anchoring the viewport would keep its scroll offset and the text
 * under your eyes would jump up by the height of the whole new page. The list
 * anchors to the end (`anchorTo: "end"`), so the message you are reading stays
 * exactly where it is and only the scrollbar changes.
 *
 * The play function pins it: it scrolls up away from the bottom, records the
 * topmost fully-visible message and its offset inside the viewport, prepends a
 * page of 40 older messages, then asserts that same message is still rendered
 * at the same offset (within 4px) — and that the list has not snapped back to
 * the newest message.
 */
export const PrependPreservesPosition: Story = {
	render: () => <PrependHarness />,
	play: async ({ canvasElement }) => {
		const viewport = getViewport(canvasElement);
		await waitFor(() => {
			assertRestingAtBottom(viewport);
		});

		// Scroll up into history. Programmatic scrollTop changes may not fire a
		// scroll event before the prepend lands — dispatch one so the component
		// registers the upward move (and unpins) now.
		viewport.scrollTop -= 600;
		viewport.dispatchEvent(new Event("scroll"));
		await tick();
		assert(
			distanceFromBottom(viewport) > TOLERANCE_PX,
			"expected to be scrolled away from the bottom before prepending",
		);

		const anchor = anchorMessage(viewport);
		const heightBefore = viewport.scrollHeight;

		const loadOlder = canvasElement.querySelector<HTMLButtonElement>(
			'[data-testid="prepend-older"]',
		);
		assert(loadOlder !== null, "the prepend-older control is missing");
		loadOlder.click();

		// The page has landed once the scrollable content has grown by it.
		await waitFor(() => {
			assert(
				viewport.scrollHeight > heightBefore,
				"prepending a page did not grow the scrollable content",
			);
		});
		await tick();

		const anchorAfter = viewport.querySelector<HTMLElement>(
			`[data-message-id="${anchor.id}"]`,
		);
		assert(
			anchorAfter !== null,
			`prepending pushed ${anchor.id} out of the rendered window entirely`,
		);
		const drift = Math.abs(
			offsetWithinViewport(anchorAfter, viewport) - anchor.offset,
		);
		assert(
			drift <= TOLERANCE_PX,
			`expected ${anchor.id} to stay put across the prepend, but it moved ${Math.round(drift)}px`,
		);
		assert(
			distanceFromBottom(viewport) > TOLERANCE_PX,
			"prepending snapped the list back to the newest message",
		);
	},
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
