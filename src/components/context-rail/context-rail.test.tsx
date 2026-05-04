// src/components/context-rail/context-rail.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextRail } from "./context-rail";

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
						<button data-testid="action" onClick={onAction}>
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
		const root = container.querySelector('[data-section-id="s1"]') as HTMLElement;
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
});
