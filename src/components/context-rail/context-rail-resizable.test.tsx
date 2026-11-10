// src/components/context-rail/context-rail-resizable.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Plus } from "lucide-react";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { ContextRail, type ContextRailResizable } from "./context-rail";

const SECTION_ID = "section";

const RESIZABLE: ContextRailResizable = {
	defaultWidth: 360,
	minWidth: 320,
	maxWidth: 600,
};

function renderRail(
	props: { resizable?: ContextRailResizable; storageKey?: string } = {},
) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<ContextRail {...props}>
				<ContextRail.Section id={SECTION_ID} label="Section">
					<ContextRail.IconButton icon={<Plus />} label="Add" />
				</ContextRail.Section>
			</ContextRail>
		</ChakraProvider>,
	);
}

const HALF_THE_SPACE: ContextRailResizable = {
	defaultWidth: 360,
	minWidth: 320,
	maxWidth: (space) => space / 2,
};

/** The rail in a column, after a main column — AppShell's arrangement. */
function renderBesideMain(resizable: ContextRailResizable) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<div>
				<div data-testid="main" />
				<div>
					<ContextRail resizable={resizable}>body</ContextRail>
				</div>
			</div>
		</ChakraProvider>,
	);
}

function separator() {
	return screen.getByRole("separator", { name: "Resize context rail" });
}

function railWidth() {
	return screen.getByTestId("context-rail").style.width;
}

/**
 * jsdom ships no PointerEvent, so `fireEvent.pointer*` would drop `clientX`
 * and `button`. A MouseEvent subclass carries them.
 */
class PointerEventPolyfill extends MouseEvent {
	readonly pointerId: number;
	constructor(
		type: string,
		init: MouseEventInit & { pointerId?: number } = {},
	) {
		super(type, init);
		this.pointerId = init.pointerId ?? 1;
	}
}

beforeAll(() => {
	if (!("PointerEvent" in window)) {
		(window as unknown as { PointerEvent: unknown }).PointerEvent =
			PointerEventPolyfill;
	}
});

let keyCounter = 0;
function uniqueKey() {
	keyCounter += 1;
	return `test.resizable-rail.${keyCounter}`;
}

describe("ContextRail without the resizable option", () => {
	beforeEach(() => {
		localStorage.clear();
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
	});

	it("keeps its fixed 360px width", () => {
		renderRail();
		const rail = screen.getByTestId("context-rail");
		expect(rail).toHaveStyle({ width: "360px" });
		expect(rail.style.width).toBe("");
	});

	it("renders no resize handle and stores no width", async () => {
		const user = userEvent.setup();
		renderRail({ storageKey: "test.fixed-rail" });
		expect(screen.queryByRole("separator")).not.toBeInTheDocument();
		await user.click(screen.getByTestId("context-rail-toggle"));
		expect(localStorage.getItem("test.fixed-rail:width")).toBeNull();
	});
});

describe("ContextRail with the resizable option", () => {
	beforeEach(() => {
		localStorage.clear();
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
	});
	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	it("starts at its default width", () => {
		renderRail({ resizable: RESIZABLE });
		expect(railWidth()).toBe("360px");
	});

	it("announces its handle as a vertical separator with its value and bounds", () => {
		renderRail({ resizable: RESIZABLE });
		const handle = separator();
		expect(handle).toHaveAttribute("aria-orientation", "vertical");
		expect(handle).toHaveAttribute("aria-valuenow", "360");
		expect(handle).toHaveAttribute("aria-valuemin", "320");
		expect(handle).toHaveAttribute("aria-valuemax", "600");
		expect(handle).toHaveAttribute("tabindex", "0");
	});

	it("widens on ArrowLeft and narrows on ArrowRight", () => {
		renderRail({ resizable: RESIZABLE });
		const handle = separator();
		fireEvent.keyDown(handle, { key: "ArrowLeft" });
		expect(railWidth()).toBe("376px");
		expect(handle).toHaveAttribute("aria-valuenow", "376");
		fireEvent.keyDown(handle, { key: "ArrowRight" });
		fireEvent.keyDown(handle, { key: "ArrowRight" });
		expect(railWidth()).toBe("344px");
	});

	it("keeps arrow-key resizing within its minimum and maximum", () => {
		const key = uniqueKey();
		renderRail({ resizable: RESIZABLE, storageKey: key });
		const handle = separator();
		for (let i = 0; i < 10; i++)
			fireEvent.keyDown(handle, { key: "ArrowRight" });
		expect(railWidth()).toBe("320px");
		expect(localStorage.getItem(`${key}:width`)).toBe("320");
		for (let i = 0; i < 30; i++)
			fireEvent.keyDown(handle, { key: "ArrowLeft" });
		expect(railWidth()).toBe("600px");
		expect(localStorage.getItem(`${key}:width`)).toBe("600");
	});

	it("ignores other keys", () => {
		renderRail({ resizable: RESIZABLE });
		fireEvent.keyDown(separator(), { key: "ArrowUp" });
		fireEvent.keyDown(separator(), { key: "a" });
		expect(railWidth()).toBe("360px");
		expect(separator()).toHaveAttribute("aria-valuenow", "360");
	});

	it("drags its leading edge: moving left widens, moving right narrows", () => {
		renderRail({ resizable: RESIZABLE });
		const handle = separator();
		fireEvent.pointerDown(handle, { clientX: 1000, button: 0 });
		fireEvent.pointerMove(window, { clientX: 900 });
		expect(railWidth()).toBe("460px");
		fireEvent.pointerMove(window, { clientX: 1020 });
		expect(railWidth()).toBe("340px");
		fireEvent.pointerUp(window, { clientX: 1020 });
		fireEvent.pointerMove(window, { clientX: 500 });
		expect(railWidth()).toBe("340px");
	});

	it("keeps a drag within its minimum and maximum", () => {
		const key = uniqueKey();
		renderRail({ resizable: RESIZABLE, storageKey: key });
		const handle = separator();
		fireEvent.pointerDown(handle, { clientX: 1000, button: 0 });
		fireEvent.pointerMove(window, { clientX: 1500 });
		expect(railWidth()).toBe("320px");
		fireEvent.pointerMove(window, { clientX: 100 });
		expect(railWidth()).toBe("600px");
		fireEvent.pointerUp(window);
		expect(localStorage.getItem(`${key}:width`)).toBe("600");
	});

	it("stores a dragged width when the drag ends, not on every move", () => {
		const key = uniqueKey();
		renderRail({ resizable: RESIZABLE, storageKey: key });
		fireEvent.pointerDown(separator(), { clientX: 1000, button: 0 });
		fireEvent.pointerMove(window, { clientX: 900 });
		expect(localStorage.getItem(`${key}:width`)).toBeNull();
		fireEvent.pointerUp(window);
		expect(localStorage.getItem(`${key}:width`)).toBe("460");
	});

	it("starts no drag from a non-primary button", () => {
		renderRail({ resizable: RESIZABLE });
		fireEvent.pointerDown(separator(), { clientX: 1000, button: 2 });
		fireEvent.pointerMove(window, { clientX: 900 });
		expect(railWidth()).toBe("360px");
	});

	it("drops its width transition while dragging, so the edge follows the pointer", () => {
		renderRail({ resizable: RESIZABLE });
		const rail = screen.getByTestId("context-rail");
		expect(rail).toHaveStyle({ transition: "width 250ms ease-out" });
		fireEvent.pointerDown(separator(), { clientX: 1000, button: 0 });
		expect(rail).toHaveStyle({ transition: "none" });
		fireEvent.pointerUp(window);
		expect(rail).toHaveStyle({ transition: "width 250ms ease-out" });
	});

	it("resets to its default width on a double-click", () => {
		renderRail({ resizable: RESIZABLE });
		const handle = separator();
		fireEvent.keyDown(handle, { key: "ArrowLeft" });
		fireEvent.keyDown(handle, { key: "ArrowLeft" });
		expect(railWidth()).toBe("392px");
		fireEvent.doubleClick(handle);
		expect(railWidth()).toBe("360px");
	});

	it("takes a maximum computed from the space it shares with the main column", () => {
		renderBesideMain(HALF_THE_SPACE);
		// jsdom lays nothing out; give the main column and the rail positions.
		const main = screen.getByTestId("main");
		const rail = screen.getByTestId("context-rail");
		vi.spyOn(main, "getBoundingClientRect").mockReturnValue({
			left: 200,
		} as DOMRect);
		vi.spyOn(rail, "getBoundingClientRect").mockReturnValue({
			right: 1200,
		} as DOMRect);
		const handle = separator();
		fireEvent.pointerDown(handle, { clientX: 1000, button: 0 });
		fireEvent.pointerMove(window, { clientX: 100 });
		fireEvent.pointerUp(window);
		expect(railWidth()).toBe("500px");
		expect(handle).toHaveAttribute("aria-valuemax", "500");
	});

	it("imposes no maximum while the shared space cannot be measured", () => {
		// jsdom lays nothing out: every rect is zero.
		renderBesideMain(HALF_THE_SPACE);
		expect(railWidth()).toBe("360px");
		expect(separator()).not.toHaveAttribute("aria-valuemax");
	});

	it("measures the shared space again when the window resizes", () => {
		renderBesideMain(HALF_THE_SPACE);
		vi.spyOn(
			screen.getByTestId("main"),
			"getBoundingClientRect",
		).mockReturnValue({ left: 0 } as DOMRect);
		vi.spyOn(
			screen.getByTestId("context-rail"),
			"getBoundingClientRect",
		).mockReturnValue({ right: 1400 } as DOMRect);
		fireEvent(window, new Event("resize"));
		expect(separator()).toHaveAttribute("aria-valuemax", "700");
	});

	it("lets the maximum win over the minimum when the space is too small", () => {
		renderRail({
			resizable: { defaultWidth: 360, minWidth: 320, maxWidth: 280 },
		});
		expect(railWidth()).toBe("280px");
		expect(separator()).toHaveAttribute("aria-valuemin", "280");
		expect(separator()).toHaveAttribute("aria-valuemax", "280");
	});

	it("shows a stored width clamped without overwriting it", () => {
		const key = uniqueKey();
		localStorage.setItem(`${key}:width`, "500");
		renderRail({
			resizable: { defaultWidth: 360, minWidth: 320, maxWidth: 400 },
			storageKey: key,
		});
		expect(railWidth()).toBe("400px");
		expect(localStorage.getItem(`${key}:width`)).toBe("500");
	});

	it("remembers its width across a remount through storageKey", () => {
		const key = uniqueKey();
		const first = renderRail({ resizable: RESIZABLE, storageKey: key });
		fireEvent.keyDown(separator(), { key: "ArrowLeft" });
		expect(localStorage.getItem(`${key}:width`)).toBe("376");
		first.unmount();
		renderRail({ resizable: RESIZABLE, storageKey: key });
		expect(railWidth()).toBe("376px");
	});

	it("keeps its collapsed flag under storageKey itself", async () => {
		const key = uniqueKey();
		const user = userEvent.setup();
		renderRail({ resizable: RESIZABLE, storageKey: key });
		await user.click(screen.getByTestId("context-rail-toggle"));
		expect(localStorage.getItem(key)).toBe("true");
	});

	it("clamps a stored width into its bounds and ignores garbage", () => {
		const key = uniqueKey();
		localStorage.setItem(`${key}:width`, "9999");
		const first = renderRail({ resizable: RESIZABLE, storageKey: key });
		expect(railWidth()).toBe("600px");
		first.unmount();
		localStorage.setItem(`${key}:width`, "wide");
		renderRail({ resizable: RESIZABLE, storageKey: key });
		expect(railWidth()).toBe("360px");
	});

	it("works at its default width when storage throws", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		renderRail({ resizable: RESIZABLE, storageKey: uniqueKey() });
		expect(railWidth()).toBe("360px");
		fireEvent.keyDown(separator(), { key: "ArrowLeft" });
		expect(railWidth()).toBe("376px");
	});

	it("collapses to the 44px rail with its compact atoms and returns to its width", async () => {
		const user = userEvent.setup();
		renderRail({ resizable: RESIZABLE, storageKey: uniqueKey() });
		fireEvent.keyDown(separator(), { key: "ArrowLeft" });
		await user.click(screen.getByTestId("context-rail-toggle"));
		const rail = screen.getByTestId("context-rail");
		expect(rail).toHaveAttribute("data-collapsed", "true");
		expect(rail).toHaveStyle({ width: "44px" });
		expect(rail.style.width).toBe("");
		expect(screen.queryByRole("separator")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
		await user.click(screen.getByTestId("context-rail-toggle"));
		expect(railWidth()).toBe("376px");
	});
});
