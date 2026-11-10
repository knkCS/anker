// ContextRail's resizable width, laid out by a real browser (#284).
//
// jsdom lays nothing out, so the unit tests fake the rail's and the main
// column's positions. Here the rail sits in a real AppShell in Chromium (the
// `layout` project of `vitest.config.ts`): the fixed rail measures 360px, and
// a resizable rail whose maximum is half the space it shares with the main
// column stops there when dragged, leaving the main column the other half.
import { act, StrictMode } from "react";
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

async function mount(resizable?: ContextRailResizable): Promise<HTMLElement> {
	localStorage.clear();
	// The 1280px viewport is below the collapse breakpoint: start expanded.
	localStorage.setItem(STORAGE_KEY, "false");
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
							<ContextRail storageKey={STORAGE_KEY} resizable={resizable}>
								<ContextRail.Header title="Rail" />
							</ContextRail>
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
