// src/components/virtualized-message-list/virtualized-message-list.test.tsx
import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ruleTextFor } from "../../test/recipe-styles";
import { createAnkerTheme } from "../../theme/create-theme";
import { VirtualizedMessageList } from "./virtualized-message-list";

// The anker system is required (not defaultSystem): the `messageList` slot
// recipe only exists in anker's theme, and the dead-recipe guard asserts that
// its styles actually land in the DOM.
const system = createAnkerTheme();
function renderWithAnkerTheme(ui: ReactElement) {
	return render(<ChakraProvider value={system}>{ui}</ChakraProvider>);
}

interface Msg {
	id: string;
	sentAt: Date;
	body: string;
}

const msg = (id: string, iso: string): Msg => ({
	id,
	sentAt: new Date(iso),
	body: `body-${id}`,
});

const baseProps = {
	getItemKey: (m: Msg) => m.id,
	getItemDate: (m: Msg) => m.sentAt,
	renderItem: (m: Msg) => <p data-testid={`msg-${m.id}`}>{m.body}</p>,
};

const twoDays = [
	msg("a", "2026-07-27T09:00:00"),
	msg("b", "2026-07-27T10:00:00"),
	msg("c", "2026-07-28T08:00:00"),
];

/**
 * Rule text for the first element carrying `testId`. `getAll…[0]` rather than
 * `getByTestId`: `message-list-divider` renders once per day boundary, and the
 * recipe assertion only needs one of them.
 */
function ruleTextForTestId(testId: string) {
	return ruleTextFor(screen.getAllByTestId(testId)[0]);
}

/** Fakes scroll metrics on the viewport, then fires a scroll event. */
function scrollViewportTo(metrics: {
	scrollTop: number;
	scrollHeight: number;
	clientHeight: number;
}) {
	const viewport = screen.getByTestId("message-list-viewport");
	Object.defineProperty(viewport, "scrollTop", {
		value: metrics.scrollTop,
		configurable: true,
		writable: true,
	});
	Object.defineProperty(viewport, "scrollHeight", {
		value: metrics.scrollHeight,
		configurable: true,
	});
	Object.defineProperty(viewport, "clientHeight", {
		value: metrics.clientHeight,
		configurable: true,
	});
	fireEvent.scroll(viewport);
}

// jsdom performs no layout, so every element measures 0×0 and the virtualizer
// would render no rows. The virtualizer reads the viewport via offsetWidth/
// offsetHeight and row sizes via getBoundingClientRect — fake both to give it
// a 400×600 viewport. Row heights then measure 600px each, which only makes
// the virtual window smaller — rendering logic is unaffected.
const offsetDescriptors = {
	offsetHeight: Object.getOwnPropertyDescriptor(
		HTMLElement.prototype,
		"offsetHeight",
	),
	offsetWidth: Object.getOwnPropertyDescriptor(
		HTMLElement.prototype,
		"offsetWidth",
	),
};
beforeAll(() => {
	Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
		configurable: true,
		value: 600,
	});
	Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
		configurable: true,
		value: 400,
	});
	vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
		() =>
			({
				width: 400,
				height: 600,
				top: 0,
				left: 0,
				bottom: 600,
				right: 400,
				x: 0,
				y: 0,
				toJSON: () => ({}),
			}) as DOMRect,
	);
});
afterAll(() => {
	vi.restoreAllMocks();
	for (const [name, descriptor] of Object.entries(offsetDescriptors)) {
		if (descriptor) {
			Object.defineProperty(HTMLElement.prototype, name, descriptor);
		}
	}
});

describe("VirtualizedMessageList", () => {
	it("renders items through the render prop untouched, in order", () => {
		renderWithAnkerTheme(
			<VirtualizedMessageList
				items={twoDays}
				{...baseProps}
				renderItem={(m) => (
					<code data-testid={`msg-${m.id}`} data-lang="ts">
						{m.body}
					</code>
				)}
			/>,
		);
		const a = screen.getByTestId("msg-a");
		expect(a.tagName).toBe("CODE");
		expect(a).toHaveAttribute("data-lang", "ts");
		expect(a).toHaveTextContent("body-a");
		expect(screen.getByTestId("msg-c")).toBeInTheDocument();
	});

	it("renders a day divider per local-day boundary with the formatted label", () => {
		renderWithAnkerTheme(
			<VirtualizedMessageList
				items={twoDays}
				{...baseProps}
				formatDayLabel={(date) => `day-${date.getDate()}`}
			/>,
		);
		const dividers = screen.getAllByTestId("message-list-divider");
		expect(dividers).toHaveLength(2);
		expect(dividers[0]).toHaveTextContent("day-27");
		expect(dividers[1]).toHaveTextContent("day-28");
	});

	it("renders no dividers when getItemDate is not provided", () => {
		renderWithAnkerTheme(
			<VirtualizedMessageList
				items={twoDays}
				{...baseProps}
				getItemDate={undefined}
			/>,
		);
		expect(screen.queryAllByTestId("message-list-divider")).toHaveLength(0);
	});

	it("consumes the registered `messageList` slot recipe (guard against dead recipes)", () => {
		renderWithAnkerTheme(
			<VirtualizedMessageList items={twoDays} {...baseProps} />,
		);
		// Viewport carries the recipe's scroll styles; the divider carries the
		// boundary-line border token. Both only hold if the recipe is registered
		// in create-theme.ts AND the component consumes it.
		expect(ruleTextForTestId("message-list-viewport")).toContain(
			"overflow-y:auto",
		);
		expect(ruleTextForTestId("message-list-divider")).toContain(
			"var(--chakra-colors-border)",
		);
	});

	it("labels the scroll region as an accessible log", () => {
		renderWithAnkerTheme(
			<VirtualizedMessageList
				items={twoDays}
				{...baseProps}
				aria-label="Chat with Ada"
			/>,
		);
		expect(screen.getByRole("log", { name: "Chat with Ada" })).toBe(
			screen.getByTestId("message-list-viewport"),
		);
	});

	it("shows the jump-to-latest pill only after scrolling away from the bottom", () => {
		renderWithAnkerTheme(
			<VirtualizedMessageList items={twoDays} {...baseProps} />,
		);
		expect(screen.queryByTestId("message-list-jump")).not.toBeInTheDocument();
		// 2000px of content, viewport shows 400px, user is 1200px above bottom.
		scrollViewportTo({ scrollTop: 400, scrollHeight: 2000, clientHeight: 400 });
		expect(screen.getByTestId("message-list-jump")).toHaveTextContent(
			"Jump to latest",
		);
		// Back to the bottom: pill disappears.
		scrollViewportTo({
			scrollTop: 1600,
			scrollHeight: 2000,
			clientHeight: 400,
		});
		expect(screen.queryByTestId("message-list-jump")).not.toBeInTheDocument();
	});

	it("follows appended items only while pinned to the bottom, via direct DOM scroll", () => {
		const { rerender } = renderWithAnkerTheme(
			<VirtualizedMessageList items={twoDays} {...baseProps} />,
		);
		const viewport = screen.getByTestId("message-list-viewport");
		// Pinned at the bottom of 2000px of content.
		scrollViewportTo({
			scrollTop: 1600,
			scrollHeight: 2000,
			clientHeight: 400,
		});
		// An appended item scrolls the list to the end by writing scrollTop
		// directly — the virtualizer's scroll methods start a reconcile loop
		// that fights concurrent user scrolling, so they must not be used here.
		rerender(
			<ChakraProvider value={system}>
				<VirtualizedMessageList
					items={[...twoDays, msg("d", "2026-07-28T09:00:00")]}
					{...baseProps}
				/>
			</ChakraProvider>,
		);
		expect(viewport.scrollTop).toBe(2000);
		// Scrolled up: appends must not move the viewport.
		scrollViewportTo({ scrollTop: 100, scrollHeight: 2000, clientHeight: 400 });
		rerender(
			<ChakraProvider value={system}>
				<VirtualizedMessageList
					items={[
						...twoDays,
						msg("d", "2026-07-28T09:00:00"),
						msg("e", "2026-07-28T09:05:00"),
					]}
					{...baseProps}
				/>
			</ChakraProvider>,
		);
		expect(viewport.scrollTop).toBe(100);
	});

	it("any upward scroll movement unpins, even while still within the pin threshold", () => {
		renderWithAnkerTheme(
			<VirtualizedMessageList items={twoDays} {...baseProps} />,
		);
		// At the bottom: pinned.
		scrollViewportTo({
			scrollTop: 1600,
			scrollHeight: 2000,
			clientHeight: 400,
		});
		expect(screen.queryByTestId("message-list-jump")).not.toBeInTheDocument();
		// First observable movement of an upward gesture: 30px up, still within
		// the 48px default pin threshold. Distance alone would say "pinned" —
		// direction must win, or an append landing now yanks the list down.
		scrollViewportTo({
			scrollTop: 1570,
			scrollHeight: 2000,
			clientHeight: 400,
		});
		expect(screen.getByTestId("message-list-jump")).toBeInTheDocument();
		// Scrolling back down to the bottom re-pins.
		scrollViewportTo({
			scrollTop: 1600,
			scrollHeight: 2000,
			clientHeight: 400,
		});
		expect(screen.queryByTestId("message-list-jump")).not.toBeInTheDocument();
	});

	it("a wheel-up gesture unpins immediately, so a concurrent append cannot yank the list back down", () => {
		const { rerender } = renderWithAnkerTheme(
			<VirtualizedMessageList items={twoDays} {...baseProps} />,
		);
		const viewport = screen.getByTestId("message-list-viewport");
		// Scrollable and at the bottom: pinned, no pill.
		scrollViewportTo({
			scrollTop: 1600,
			scrollHeight: 2000,
			clientHeight: 400,
		});
		expect(screen.queryByTestId("message-list-jump")).not.toBeInTheDocument();
		// Wheel-up intent must unpin BEFORE any scroll movement is observable —
		// scroll events lag behind the animated gesture, and an append landing
		// in that window would otherwise scroll the list back to the end.
		fireEvent.wheel(viewport, { deltaY: -120 });
		expect(screen.getByTestId("message-list-jump")).toBeInTheDocument();
		const scrollToSpy = vi.fn();
		Object.defineProperty(viewport, "scrollTo", {
			value: scrollToSpy,
			configurable: true,
		});
		rerender(
			<ChakraProvider value={system}>
				<VirtualizedMessageList
					items={[...twoDays, msg("d", "2026-07-28T09:00:00")]}
					{...baseProps}
				/>
			</ChakraProvider>,
		);
		expect(scrollToSpy).not.toHaveBeenCalled();
	});

	it("clicking jump-to-latest hides the pill even when the programmatic scroll fires no scroll event", () => {
		renderWithAnkerTheme(
			<VirtualizedMessageList items={twoDays} {...baseProps} />,
		);
		scrollViewportTo({ scrollTop: 400, scrollHeight: 2000, clientHeight: 400 });
		// jsdom's scrollTo dispatches no scroll event — exactly the case where
		// pinned state must not depend on one.
		fireEvent.click(screen.getByTestId("message-list-jump"));
		expect(screen.queryByTestId("message-list-jump")).not.toBeInTheDocument();
	});

	it("fires onLoadOlder once when the top is approached, re-arming only after leaving", () => {
		const onLoadOlder = vi.fn();
		renderWithAnkerTheme(
			<VirtualizedMessageList
				items={twoDays}
				{...baseProps}
				onLoadOlder={onLoadOlder}
				loadOlderThreshold={200}
			/>,
		);
		scrollViewportTo({ scrollTop: 900, scrollHeight: 2000, clientHeight: 400 });
		expect(onLoadOlder).not.toHaveBeenCalled();
		scrollViewportTo({ scrollTop: 150, scrollHeight: 2000, clientHeight: 400 });
		expect(onLoadOlder).toHaveBeenCalledTimes(1);
		// Still within the threshold: no refire.
		scrollViewportTo({ scrollTop: 50, scrollHeight: 2000, clientHeight: 400 });
		expect(onLoadOlder).toHaveBeenCalledTimes(1);
		// Leave and approach again: fires once more.
		scrollViewportTo({ scrollTop: 900, scrollHeight: 2000, clientHeight: 400 });
		scrollViewportTo({ scrollTop: 100, scrollHeight: 2000, clientHeight: 400 });
		expect(onLoadOlder).toHaveBeenCalledTimes(2);
	});

	it("sets displayName", () => {
		expect(
			(VirtualizedMessageList as { displayName?: string }).displayName,
		).toBe("VirtualizedMessageList");
	});
});
