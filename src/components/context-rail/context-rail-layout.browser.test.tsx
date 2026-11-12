// ContextRail's resizable width, laid out by a real browser (#284).
//
// jsdom lays nothing out, so the unit tests fake the rail's and the main
// column's positions. Here the rail sits in a real AppShell in Chromium (the
// `layout` project of `vitest.config.ts`): the fixed rail measures 360px, and
// a resizable rail whose maximum is half the space it shares with the main
// column stops there when dragged, leaving the main column the other half.
// A rail with tabs keeps its tablist inside the 360px column, and collapsed
// its tab buttons — indicators included — inside the 44px column (#660 on
// knkCS/contenthub).
import { GitBranch, ScanSearch, Upload } from "lucide-react";
import { act, StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Box } from "../../primitives/layout";
import { Provider } from "../../primitives/provider";
import { AppShell } from "../../templates/app-shell";
import { ContextRail, type ContextRailResizable } from "./context-rail";

const SIDEBAR_WIDTH = 240;
const STORAGE_KEY = "layout.context-rail";

let root: Root | undefined;
let host: HTMLDivElement | undefined;

/**
 * A rail whose tab is held above the rail, as a screen holds it: the rail
 * swaps its body on collapse and expand, so state inside it does not survive.
 */
function TabbedRail({ resizable }: { resizable?: ContextRailResizable }) {
	const [tab, setTab] = useState("branch");
	return (
		<ContextRail storageKey={STORAGE_KEY} resizable={resizable}>
			<ContextRail.Header title="Rail" />
			<ContextRail.Tabs label="Rail" value={tab} onValueChange={setTab}>
				<ContextRail.Tab
					value="branch"
					label="Branch"
					icon={<GitBranch size={14} />}
					indicator={{ kind: "badge", count: 12, label: "12 blockers" }}
				>
					<ContextRail.Section id="actions" label="Actions">
						<ContextRail.IconButton
							label="Publish"
							icon={<Upload size={14} />}
						/>
					</ContextRail.Section>
				</ContextRail.Tab>
				<ContextRail.Tab
					value="field"
					label="Field"
					icon={<ScanSearch size={14} />}
					indicator={{ kind: "dot", label: "A field has focus" }}
				>
					<ContextRail.Section id="inspector" label="Inspector">
						<div data-testid="inspector">inspector</div>
					</ContextRail.Section>
				</ContextRail.Tab>
			</ContextRail.Tabs>
		</ContextRail>
	);
}

async function mount(
	resizable?: ContextRailResizable,
	options: { collapsed?: boolean; tabs?: boolean } = {},
): Promise<HTMLElement> {
	localStorage.clear();
	// The 1280px viewport is below the collapse breakpoint: start expanded
	// unless asked otherwise.
	localStorage.setItem(STORAGE_KEY, options.collapsed ? "true" : "false");
	host = document.createElement("div");
	document.body.appendChild(host);
	root = createRoot(host);
	await act(async () => {
		root?.render(
			<StrictMode>
				<Provider>
					<AppShell
						sidebar={<Box w={`${SIDEBAR_WIDTH}px`} h="full" />}
						rail={
							options.tabs ? (
								<TabbedRail resizable={resizable} />
							) : (
								<ContextRail storageKey={STORAGE_KEY} resizable={resizable}>
									<ContextRail.Header title="Rail" />
								</ContextRail>
							)
						}
					>
						<Box>main</Box>
					</AppShell>
				</Provider>
			</StrictMode>,
		);
	});
	// Styles settle a frame after mount.
	await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
	return host;
}

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = undefined;
	host = undefined;
	localStorage.clear();
});

function width(container: HTMLElement, testId: string): number {
	const el = container.querySelector<HTMLElement>(`[data-testid='${testId}']`);
	if (!el) throw new Error(`no ${testId}`);
	return el.getBoundingClientRect().width;
}

function pointer(target: EventTarget, type: string, clientX: number) {
	target.dispatchEvent(
		new PointerEvent(type, { clientX, button: 0, bubbles: true }),
	);
}

describe("ContextRail in an AppShell", () => {
	it("keeps its fixed 360px without the resizable option", async () => {
		const container = await mount();
		await expect.poll(() => width(container, "context-rail")).toBe(360);
		expect(
			container.querySelector("[data-testid='context-rail-resize-handle']"),
		).toBeNull();
	});

	it("drags no wider than half the space it shares with the main column", async () => {
		const container = await mount({
			defaultWidth: 360,
			minWidth: 320,
			maxWidth: (space) => space / 2,
		});
		await expect.poll(() => width(container, "context-rail")).toBe(360);
		const handle = container.querySelector<HTMLElement>(
			"[data-testid='context-rail-resize-handle']",
		);
		if (!handle) throw new Error("no handle");
		const shared = window.innerWidth - SIDEBAR_WIDTH;
		await act(async () => {
			pointer(handle, "pointerdown", 1000);
			pointer(window, "pointermove", 0);
			pointer(window, "pointerup", 0);
		});
		await expect.poll(() => width(container, "context-rail")).toBe(shared / 2);
		expect(width(container, "app-shell-main")).toBeGreaterThanOrEqual(
			shared / 2 - 1,
		);
	});
});

function rect(container: HTMLElement, selector: string): DOMRect {
	const el = container.querySelector<HTMLElement>(selector);
	if (!el) throw new Error(`no ${selector}`);
	return el.getBoundingClientRect();
}

function within(inner: DOMRect, outer: DOMRect): boolean {
	return (
		inner.left >= outer.left - 0.5 &&
		inner.right <= outer.right + 0.5 &&
		inner.width > 0 &&
		inner.height > 0
	);
}

describe("ContextRail with tabs in an AppShell", () => {
	it("lays its tabs out in one row inside the expanded 360px column", async () => {
		const container = await mount(undefined, { tabs: true });
		await expect.poll(() => width(container, "context-rail")).toBe(360);
		const rail = rect(container, "[data-testid='context-rail']");
		const tabs = [...container.querySelectorAll<HTMLElement>("[role='tab']")];
		expect(tabs).toHaveLength(2);
		const [branch, field] = tabs.map((t) => t.getBoundingClientRect());
		expect(within(branch, rail)).toBe(true);
		expect(within(field, rail)).toBe(true);
		expect(field.top).toBe(branch.top);
		expect(field.left).toBeGreaterThanOrEqual(branch.right);
		expect(branch.height).toBeGreaterThanOrEqual(44);
		expect(
			within(rect(container, "[data-testid='context-rail-tab-badge']"), branch),
		).toBe(true);
	});

	it("collapsed, stacks the tab buttons with their indicators inside 44px, and a tab expands the rail on it", async () => {
		const container = await mount(undefined, { collapsed: true, tabs: true });
		await expect.poll(() => width(container, "context-rail")).toBe(44);
		const rail = rect(container, "[data-testid='context-rail']");
		const group = container.querySelector<HTMLElement>(
			"[data-testid='context-rail-tabs-collapsed']",
		);
		if (!group) throw new Error("no collapsed tabs");
		const buttons = [...group.querySelectorAll<HTMLElement>("button")];
		expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
			"Branch, 12 blockers",
			"Field, A field has focus",
		]);
		const [branch, field] = buttons.map((b) => b.getBoundingClientRect());
		expect(within(branch, rail)).toBe(true);
		expect(within(field, rail)).toBe(true);
		expect(field.top).toBeGreaterThanOrEqual(branch.bottom);
		expect(
			within(rect(container, "[data-testid='context-rail-tab-badge']"), rail),
		).toBe(true);
		expect(
			within(rect(container, "[data-testid='context-rail-tab-dot']"), rail),
		).toBe(true);

		await act(async () => buttons[1].click());
		await expect.poll(() => width(container, "context-rail")).toBe(360);
		expect(
			container.querySelector("[role='tab'][aria-selected='true']")
				?.textContent,
		).toContain("Field");
		expect(container.querySelector("[data-testid='inspector']")).not.toBeNull();
	});
});
