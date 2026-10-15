// src/components/nav-list/nav-list.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavList } from "./nav-list";
import { NavListModeProvider } from "./nav-list-context";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("NavList", () => {
	it("renders as a <nav> with aria-label", () => {
		renderWithChakra(
			<NavList aria-label="Catalogs">
				<NavList.Group label="Page">
					<NavList.Item>Page geometries</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		const nav = screen.getByRole("navigation", { name: "Catalogs" });
		expect(nav).toBeInTheDocument();
	});

	it("renders group label and item text when expanded", () => {
		renderWithChakra(
			<NavList aria-label="Catalogs">
				<NavList.Group label="Typography">
					<NavList.Item>Fonts</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(screen.getByText("Typography")).toBeInTheDocument();
		expect(screen.getByText("Fonts")).toBeInTheDocument();
	});

	it("active item carries inset box-shadow border and primary color", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item active>Glue patterns</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		const row = screen.getByTestId("nav-list-item");
		expect(row).toHaveAttribute("data-active", "true");
		expect(row).toHaveAttribute("aria-current", "page");
		const style = row.getAttribute("style") || "";
		expect(style).toContain("box-shadow: inset 0 0 0 1px");
		expect(style).toContain("color: var(--chakra-colors-primary-700)");
	});

	it("active item renders the trailing pill as a flex child", () => {
		const { container } = renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item active>Glue patterns</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		// Pill is the aria-hidden <span> sibling at the end of the row.
		const pill = container.querySelector('span[aria-hidden="true"]');
		expect(pill).not.toBeNull();
		expect(pill).toHaveStyle({ width: "3px", height: "14px" });
	});

	it("non-active item renders no pill", () => {
		const { container } = renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item>Fonts</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
	});

	it("renders count when provided", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item count={10}>Glue patterns</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(screen.getByText("10")).toBeInTheDocument();
	});

	it("hides group label, item text, count, and pill when collapsed", () => {
		renderWithChakra(
			<NavListModeProvider value={{ collapsed: true }}>
				<NavList aria-label="x">
					<NavList.Group label="Typography">
						<NavList.Item count={10} active>
							Glue patterns
						</NavList.Item>
					</NavList.Group>
				</NavList>
			</NavListModeProvider>,
		);
		expect(screen.queryByText("Typography")).not.toBeInTheDocument();
		expect(screen.queryByText("Glue patterns")).not.toBeInTheDocument();
		expect(screen.queryByText("10")).not.toBeInTheDocument();
	});

	it("supports asChild router pattern", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item active asChild>
						<a href="/glue" data-testid="link">
							Glue patterns
						</a>
					</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		const link = screen.getByTestId("link");
		expect(link.tagName).toBe("A");
		expect(link).toHaveAttribute("data-active", "true");
		expect(link).toHaveAttribute("aria-current", "page");
	});

	it("Group renders item flex container with data-testid nav-list-group-items", () => {
		const { container } = renderWithChakra(
			<NavList aria-label="t">
				<NavList.Group label="Group">
					<NavList.Item>
						<span>One</span>
					</NavList.Item>
					<NavList.Item>
						<span>Two</span>
					</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(
			container.querySelector('[data-testid="nav-list-group-items"]'),
		).toBeInTheDocument();
	});
});

describe("NavList.Item badge", () => {
	function renderItem(
		ui: React.ReactElement,
		{ collapsed = false }: { collapsed?: boolean } = {},
	) {
		return renderWithChakra(
			<NavListModeProvider value={{ collapsed }}>
				<NavList aria-label="x">
					<NavList.Group>{ui}</NavList.Group>
				</NavList>
			</NavListModeProvider>,
		);
	}

	it("renders a count badge with its tone when expanded", () => {
		renderItem(
			<NavList.Item badge={{ count: 3, tone: "attention", label: "3 overdue" }}>
				Tasks
			</NavList.Item>,
		);
		const badge = screen.getByTestId("nav-list-badge");
		expect(badge).toHaveTextContent("3");
		expect(badge).toHaveAttribute("data-tone", "attention");
		expect(badge).toHaveAttribute("data-variant", "count");
		expect(badge).toHaveAttribute("data-placement", "inline");
		expect(badge).toHaveAttribute("aria-hidden", "true");
	});

	it("keeps the count badge on the collapsed rail, overlaid on the icon", () => {
		renderItem(
			<NavList.Item
				icon={<span data-testid="icon">i</span>}
				badge={{ count: 3, tone: "attention", label: "3 overdue" }}
			>
				Tasks
			</NavList.Item>,
			{ collapsed: true },
		);
		const badge = screen.getByTestId("nav-list-badge");
		expect(badge).toHaveTextContent("3");
		expect(badge).toHaveAttribute("data-placement", "rail");
		// The overlay sits in the icon's box, anchored to its top-right corner.
		expect(badge.parentElement).toContainElement(screen.getByTestId("icon"));
	});

	it("renders a dot without a number, expanded and collapsed", () => {
		for (const collapsed of [false, true]) {
			const { unmount } = renderItem(
				<NavList.Item
					icon={<span>i</span>}
					badge={{ tone: "info", label: "running" }}
				>
					Exports
				</NavList.Item>,
				{ collapsed },
			);
			const badge = screen.getByTestId("nav-list-badge");
			expect(badge).toHaveAttribute("data-variant", "dot");
			expect(badge).toHaveAttribute("data-tone", "info");
			expect(badge).toHaveTextContent("");
			unmount();
		}
	});

	it("defaults the tone to neutral", () => {
		renderItem(
			<NavList.Item badge={{ count: 5, label: "5 new" }}>Inbox</NavList.Item>,
		);
		expect(screen.getByTestId("nav-list-badge")).toHaveAttribute(
			"data-tone",
			"neutral",
		);
	});

	it("caps a numeric count at 99+", () => {
		renderItem(
			<NavList.Item badge={{ count: 250, label: "250 open" }}>
				Tasks
			</NavList.Item>,
		);
		expect(screen.getByTestId("nav-list-badge")).toHaveTextContent("99+");
	});

	it("renders no badge for a zero count", () => {
		renderItem(
			<NavList.Item badge={{ count: 0, label: "0 overdue" }}>
				Tasks
			</NavList.Item>,
		);
		expect(screen.queryByTestId("nav-list-badge")).toBeNull();
		expect(screen.queryByText(/overdue/)).toBeNull();
	});

	it("puts the badge meaning into the accessible name, expanded and collapsed", () => {
		for (const collapsed of [false, true]) {
			const { unmount } = renderItem(
				<NavList.Item
					asChild
					icon={<span>i</span>}
					badge={{ count: 3, tone: "attention", label: "3 overdue" }}
				>
					<a href="/tasks">Tasks</a>
				</NavList.Item>,
				{ collapsed },
			);
			expect(
				screen.getByRole("link", { name: "Tasks, 3 overdue" }),
			).toBeInTheDocument();
			unmount();
		}
	});

	it("uses the label prop as the name on the collapsed rail", () => {
		renderItem(
			<NavList.Item
				asChild
				label="Exports"
				icon={<span>i</span>}
				badge={{ tone: "info", label: "running" }}
			>
				<a href="/exports">
					<span>Exports</span>
				</a>
			</NavList.Item>,
			{ collapsed: true },
		);
		expect(
			screen.getByRole("link", { name: "Exports, running" }),
		).toBeInTheDocument();
	});

	it("spells the meaning out as hidden text on a plain row", () => {
		for (const [collapsed, text] of [
			[false, "Tasks, 3 overdue"],
			[true, "Tasks, 3 overdue"],
		] as const) {
			const { unmount } = renderItem(
				<NavList.Item
					icon={<svg aria-hidden="true" />}
					badge={{ count: 3, tone: "attention", label: "3 overdue" }}
				>
					Tasks
				</NavList.Item>,
				{ collapsed },
			);
			// Visible badge digits are aria-hidden; the hidden text carries the meaning.
			const row = screen
				.getByTestId("nav-list-item")
				.cloneNode(true) as HTMLElement;
			for (const el of row.querySelectorAll('[aria-hidden="true"]'))
				el.remove();
			const spoken = row.textContent;
			expect(spoken).toBe(text);
			unmount();
		}
	});

	it("appends the meaning to a child's own aria-label", () => {
		renderItem(
			<NavList.Item
				asChild
				icon={<svg aria-hidden="true" />}
				badge={{ count: 2, label: "2 failed" }}
			>
				<a href="/jobs" aria-label="Background jobs">
					<span>Jobs</span>
				</a>
			</NavList.Item>,
			{ collapsed: true },
		);
		expect(
			screen.getByRole("link", { name: "Background jobs, 2 failed" }),
		).toBeInTheDocument();
	});

	it("keeps the visible text in the expanded name when label differs", () => {
		renderItem(
			<NavList.Item
				asChild
				label="All tasks"
				badge={{ count: 3, label: "3 overdue" }}
			>
				<a href="/tasks">Tasks</a>
			</NavList.Item>,
		);
		expect(
			screen.getByRole("link", { name: "Tasks, 3 overdue" }),
		).toBeInTheDocument();
	});

	it("keeps a plain count in the name beside the badge", () => {
		renderItem(
			<NavList.Item asChild count={12} badge={{ count: 3, label: "3 overdue" }}>
				<a href="/tasks">Tasks</a>
			</NavList.Item>,
		);
		expect(
			screen.getByRole("link", { name: "Tasks, 12, 3 overdue" }),
		).toBeInTheDocument();
	});

	it("leaves the plain count unchanged: shown expanded, hidden on the rail", () => {
		renderItem(<NavList.Item count={10}>Fonts</NavList.Item>, {
			collapsed: true,
		});
		expect(screen.queryByText("10")).toBeNull();
		expect(screen.queryByTestId("nav-list-badge")).toBeNull();
	});
});
