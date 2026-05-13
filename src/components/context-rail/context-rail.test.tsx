// src/components/context-rail/context-rail.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextRail, useContextRailMode } from "./context-rail";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("ContextRail", () => {
	beforeEach(() => {
		localStorage.clear();
	});
	afterEach(() => {
		localStorage.clear();
	});

	it("renders the root with data-testid='context-rail'", () => {
		renderWithChakra(<ContextRail>content</ContextRail>);
		expect(screen.getByTestId("context-rail")).toBeInTheDocument();
	});

	it("renders children when expanded", () => {
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
		renderWithChakra(
			<ContextRail>
				<div data-testid="rail-body">body</div>
			</ContextRail>,
		);
		expect(screen.getByTestId("rail-body")).toBeInTheDocument();
		expect(screen.getByTestId("context-rail")).toHaveAttribute(
			"data-collapsed",
			"false",
		);
	});

	it("starts collapsed when viewport is narrower than 1440px", () => {
		Object.defineProperty(window, "innerWidth", {
			value: 1024,
			configurable: true,
		});
		renderWithChakra(<ContextRail>body</ContextRail>);
		expect(screen.getByTestId("context-rail")).toHaveAttribute(
			"data-collapsed",
			"true",
		);
	});

	it("toggles between expanded and collapsed when toggle button clicked", async () => {
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
		const user = userEvent.setup();
		renderWithChakra(<ContextRail>body</ContextRail>);

		expect(screen.getByTestId("context-rail")).toHaveAttribute(
			"data-collapsed",
			"false",
		);

		await user.click(screen.getByTestId("context-rail-toggle"));
		expect(screen.getByTestId("context-rail")).toHaveAttribute(
			"data-collapsed",
			"true",
		);

		await user.click(screen.getByTestId("context-rail-toggle"));
		expect(screen.getByTestId("context-rail")).toHaveAttribute(
			"data-collapsed",
			"false",
		);
	});

	it("persists collapse state to localStorage when storageKey is provided", async () => {
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
		const user = userEvent.setup();
		renderWithChakra(<ContextRail storageKey="test.rail">body</ContextRail>);

		await user.click(screen.getByTestId("context-rail-toggle"));
		expect(localStorage.getItem("test.rail")).toBe("true");

		await user.click(screen.getByTestId("context-rail-toggle"));
		expect(localStorage.getItem("test.rail")).toBe("false");
	});

	it("reads initial state from localStorage when storageKey is provided", () => {
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
		localStorage.setItem("test.rail", "true");
		renderWithChakra(<ContextRail storageKey="test.rail">body</ContextRail>);
		expect(screen.getByTestId("context-rail")).toHaveAttribute(
			"data-collapsed",
			"true",
		);
	});

	it("renders ContextRail.Header eyebrow and title", () => {
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
		renderWithChakra(
			<ContextRail>
				<ContextRail.Header eyebrow="User" title="Preview" />
			</ContextRail>,
		);
		expect(screen.getByText("User")).toBeInTheDocument();
		expect(screen.getByText("Preview")).toBeInTheDocument();
	});

	it("renders ContextRail.Section label and content", () => {
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
		renderWithChakra(
			<ContextRail>
				<ContextRail.Section id="details" icon={<span>i</span>} label="Details">
					<div data-testid="section-content">body</div>
				</ContextRail.Section>
			</ContextRail>,
		);
		expect(screen.getByText("Details")).toBeInTheDocument();
		expect(screen.getByTestId("section-content")).toBeInTheDocument();
	});

	it("renders ContextRail.Footer children", () => {
		Object.defineProperty(window, "innerWidth", {
			value: 1600,
			configurable: true,
		});
		renderWithChakra(
			<ContextRail>
				<ContextRail.Footer>
					<button type="button">Open detail</button>
				</ContextRail.Footer>
			</ContextRail>,
		);
		expect(
			screen.getByRole("button", { name: "Open detail" }),
		).toBeInTheDocument();
	});

	it("Section is open by default and toggles closed on header click", () => {
		renderWithChakra(
			<ContextRail>
				<ContextRail.Section id="s1" label="Details">
					<span data-testid="body">visible</span>
				</ContextRail.Section>
			</ContextRail>,
		);
		expect(screen.getByTestId("body")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /Details/i }));
		expect(screen.queryByTestId("body")).not.toBeInTheDocument();
	});

	it("Section respects defaultOpen={false}", () => {
		renderWithChakra(
			<ContextRail>
				<ContextRail.Section id="s1" label="Details" defaultOpen={false}>
					<span data-testid="body">hidden</span>
				</ContextRail.Section>
			</ContextRail>,
		);
		expect(screen.queryByTestId("body")).not.toBeInTheDocument();
	});

	it("Section action slot does not toggle the section when clicked", () => {
		const onAction = vi.fn();
		renderWithChakra(
			<ContextRail>
				<ContextRail.Section
					id="s1"
					label="Details"
					action={
						<button type="button" data-testid="action" onClick={onAction}>
							Manage
						</button>
					}
				>
					<span data-testid="body">body</span>
				</ContextRail.Section>
			</ContextRail>,
		);
		fireEvent.click(screen.getByTestId("action"));
		expect(onAction).toHaveBeenCalledOnce();
		expect(screen.getByTestId("body")).toBeInTheDocument();
	});

	it("Section root has bottom border", () => {
		const { container } = renderWithChakra(
			<ContextRail>
				<ContextRail.Section id="s1" label="Details">
					<span>body</span>
				</ContextRail.Section>
			</ContextRail>,
		);
		const root = container.querySelector(
			'[data-section-id="s1"]',
		) as HTMLElement;
		expect(root).toBeInTheDocument();
		expect(root).toHaveStyle({ borderBottomWidth: "1px" });
	});

	it("Header has a bottom border", () => {
		const { container } = renderWithChakra(
			<ContextRail>
				<ContextRail.Header title="User" />
			</ContextRail>,
		);
		const header = container.querySelector("h2")?.parentElement as HTMLElement;
		expect(header).toBeInTheDocument();
		expect(header).toHaveStyle({ borderBottomWidth: "1px" });
	});

	it("toggle is positioned as a floating round button on the leading edge", () => {
		renderWithChakra(
			<ContextRail>
				<ContextRail.Header title="X" />
			</ContextRail>,
		);
		const toggle = screen.getByTestId("context-rail-toggle");
		const cs = window.getComputedStyle(toggle);
		expect(cs.position).toBe("absolute");
		// Chakra v3 emits spacing tokens as CSS custom properties; we just
		// assert the `left` and `top` properties were set to *something*
		// non-empty, and that the value references the expected spacing
		// tokens. (Exact computed string differs between Chakra versions.)
		expect(cs.top).not.toBe("");
		expect(cs.left).not.toBe("");
		// Chakra emits the `-3.5` spacing token as
		// `calc(var(--chakra-spacing-3\.5) * -1)` — the dot is escaped in the
		// custom-property name. Match `3` followed by an (optionally
		// escaped) dot or underscore then `5`.
		expect(cs.left).toMatch(/spacing-3\\?[._]5/);
	});

	it("provides RailModeContext with collapsed=false when expanded", () => {
		function Probe() {
			const mode = useContextRailMode();
			return <div data-testid="probe">{String(mode.collapsed)}</div>;
		}
		Object.defineProperty(window, "innerWidth", { value: 1600, configurable: true });
		renderWithChakra(
			<ContextRail>
				<Probe />
			</ContextRail>,
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("false");
	});

	it("provides RailModeContext with collapsed=true when rail is collapsed", async () => {
		function Probe() {
			const mode = useContextRailMode();
			return <div data-testid="probe">{String(mode.collapsed)}</div>;
		}
		Object.defineProperty(window, "innerWidth", { value: 1600, configurable: true });
		const user = userEvent.setup();
		renderWithChakra(
			<ContextRail>
				<Probe />
			</ContextRail>,
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("false");
		await user.click(screen.getByTestId("context-rail-toggle"));
		expect(screen.getByTestId("probe")).toHaveTextContent("true");
	});

	it("hides Section labels and Header in collapsed mode", () => {
		Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
		renderWithChakra(
			<ContextRail>
				<ContextRail.Header eyebrow="EYE" title="Title" />
				<ContextRail.Section id="s1" label="Section label">
					<div data-testid="non-atom">free-form jsx</div>
				</ContextRail.Section>
			</ContextRail>,
		);
		// Header and Section labels are hidden in collapsed mode
		expect(screen.queryByText("Title")).not.toBeInTheDocument();
		expect(screen.queryByText("Section label")).not.toBeInTheDocument();
		// Non-atom JSX inside Section is hidden in collapsed mode
		expect(screen.queryByTestId("non-atom")).not.toBeInTheDocument();
	});

	it("renders Section children normally in expanded mode", () => {
		Object.defineProperty(window, "innerWidth", { value: 1600, configurable: true });
		renderWithChakra(
			<ContextRail>
				<ContextRail.Section id="s1" label="Section label">
					<div data-testid="non-atom">free-form jsx</div>
				</ContextRail.Section>
			</ContextRail>,
		);
		expect(screen.getByTestId("non-atom")).toBeInTheDocument();
		expect(screen.getByText("Section label")).toBeInTheDocument();
	});

	describe("dev-mode warnings", () => {
		let warnSpy: ReturnType<typeof vi.spyOn>;
		let originalNodeEnv: string | undefined;

		beforeEach(() => {
			originalNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";
			warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		});

		afterEach(() => {
			warnSpy.mockRestore();
			process.env.NODE_ENV = originalNodeEnv;
		});

		it("warns once when ContextRail.Header is rendered outside <ContextRail>", () => {
			renderWithChakra(<ContextRail.Header title="User" />);
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy.mock.calls[0]?.[0]).toContain("ContextRail.Header");
			expect(warnSpy.mock.calls[0]?.[0]).toContain(
				"was rendered outside <ContextRail>",
			);
		});

		it("warns when ContextRail.Section is rendered outside <ContextRail>", () => {
			renderWithChakra(
				<ContextRail.Section id="x" label="Details">
					<span>body</span>
				</ContextRail.Section>,
			);
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy.mock.calls[0]?.[0]).toContain("ContextRail.Section");
		});

		it("does NOT warn when children are wrapped in <ContextRail>", () => {
			renderWithChakra(
				<ContextRail>
					<ContextRail.Header title="User" />
					<ContextRail.Section id="x" label="Details">
						<span>body</span>
					</ContextRail.Section>
				</ContextRail>,
			);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it("does NOT warn in production env", () => {
			process.env.NODE_ENV = "production";
			renderWithChakra(<ContextRail.Header title="User" />);
			expect(warnSpy).not.toHaveBeenCalled();
		});
	});
});

describe("ContextRail.IconButton", () => {
	it("renders an outline Button with label text in expanded mode", () => {
		Object.defineProperty(window, "innerWidth", { value: 1600, configurable: true });
		renderWithChakra(
			<ContextRail>
				<ContextRail.IconButton
					label="Invite user"
					icon={<span data-testid="ico">＋</span>}
					onClick={() => {}}
				/>
			</ContextRail>,
		);
		expect(screen.getByRole("button", { name: /Invite user/i })).toBeInTheDocument();
		expect(screen.getByTestId("ico")).toBeInTheDocument();
	});

	it("renders an icon-only IconButton with aria-label in collapsed mode", () => {
		Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
		renderWithChakra(
			<ContextRail>
				<ContextRail.IconButton
					label="Invite user"
					icon={<span data-testid="ico">＋</span>}
					onClick={() => {}}
				/>
			</ContextRail>,
		);
		expect(screen.getByTestId("ico")).toBeInTheDocument();
		// Visible text "Invite user" is not in the DOM (only in the tooltip / aria-label)
		expect(screen.queryByText("Invite user")).not.toBeInTheDocument();
		// Button is reachable by aria-label
		expect(screen.getByRole("button", { name: "Invite user" })).toBeInTheDocument();
	});

	it("calls onClick when clicked", async () => {
		const onClick = vi.fn();
		const user = userEvent.setup();
		renderWithChakra(
			<ContextRail>
				<ContextRail.IconButton label="Action" icon={<span>X</span>} onClick={onClick} />
			</ContextRail>,
		);
		await user.click(screen.getByRole("button", { name: /Action/i }));
		expect(onClick).toHaveBeenCalledOnce();
	});

	it("is tagged with RAIL_ATOM", () => {
		const type = ContextRail.IconButton as unknown as { railAtom: symbol };
		expect(type.railAtom).toBe(Symbol.for("anker.contextRail.atom"));
	});
});
