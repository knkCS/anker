// src/components/sidebar/sidebar.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar, useSidebarContext } from "./sidebar";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

// Helper: render with sidebar forced expanded (innerWidth > 1440)
function renderExpanded(ui: React.ReactElement) {
	Object.defineProperty(window, "innerWidth", {
		configurable: true,
		value: 1600,
	});
	return renderWithChakra(ui);
}

describe("Sidebar", () => {
	it("renders the root with data-testid='sidebar'", () => {
		renderWithChakra(
			<Sidebar>
				<Sidebar.Body>body</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.getByTestId("sidebar")).toBeInTheDocument();
	});

	it("renders Sidebar.Logo wordmark and subtitle", () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Header>
					<Sidebar.Logo wordmark="Odon" subtitle="Identity Provider" />
				</Sidebar.Header>
				<Sidebar.Body />
			</Sidebar>,
		);
		expect(screen.getByText("Odon")).toBeInTheDocument();
		expect(screen.getByText("Identity Provider")).toBeInTheDocument();
	});

	it("renders Sidebar.Logo without subtitle when omitted", () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Header>
					<Sidebar.Logo wordmark="Odon" />
				</Sidebar.Header>
				<Sidebar.Body />
			</Sidebar>,
		);
		expect(screen.getByText("Odon")).toBeInTheDocument();
		expect(screen.queryByText("Identity Provider")).not.toBeInTheDocument();
	});

	it("renders Sidebar.Slot children", () => {
		renderWithChakra(
			<Sidebar>
				<Sidebar.Header>
					<Sidebar.Slot>
						<span data-testid="slot-content">switcher</span>
					</Sidebar.Slot>
				</Sidebar.Header>
				<Sidebar.Body />
			</Sidebar>,
		);
		expect(screen.getByTestId("slot-content")).toBeInTheDocument();
	});

	it("renders Sidebar.Section label and children", () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Body>
					<Sidebar.Section label="Identity">
						<span data-testid="item">A</span>
					</Sidebar.Section>
				</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.getByText("Identity")).toBeInTheDocument();
		expect(screen.getByTestId("item")).toBeInTheDocument();
	});

	it("renders Sidebar.Item with icon and children", () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Body>
					<Sidebar.Section label="Identity">
						<Sidebar.Item icon={<span data-testid="icon">i</span>}>
							Users
						</Sidebar.Item>
					</Sidebar.Section>
				</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.getByTestId("icon")).toBeInTheDocument();
		expect(screen.getByText("Users")).toBeInTheDocument();
	});

	it("Sidebar.Item with asChild forwards to its child element", () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Body>
					<Sidebar.Section label="Identity">
						<Sidebar.Item asChild icon={<span>i</span>}>
							<a href="/users" data-testid="link">
								Users
							</a>
						</Sidebar.Item>
					</Sidebar.Section>
				</Sidebar.Body>
			</Sidebar>,
		);
		const link = screen.getByTestId("link");
		expect(link).toBeInTheDocument();
		expect(link.getAttribute("href")).toBe("/users");
	});

	it("Sidebar.Item asChild renders the icon inside the cloned element", () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Body>
					<Sidebar.Section label="Identity">
						<Sidebar.Item asChild icon={<span data-testid="nav-icon">i</span>}>
							<a href="/users" data-testid="link">
								Users
							</a>
						</Sidebar.Item>
					</Sidebar.Section>
				</Sidebar.Body>
			</Sidebar>,
		);
		const link = screen.getByTestId("link");
		const icon = screen.getByTestId("nav-icon");
		expect(link).toContainElement(icon);
		expect(link.textContent).toContain("Users");
	});

	it("Sidebar.Item asChild applies active styling as inline CSS variables", () => {
		// Regression: prior versions passed Chakra prop shorthand (bg="primary.50",
		// borderRadius="md", color="primary.700") through `style={...}`, which
		// the browser silently dropped — active items were visually identical to
		// inactive ones. Styles must be CSS-var references to survive inline.
		renderExpanded(
			<Sidebar>
				<Sidebar.Body>
					<Sidebar.Section label="Identity">
						<Sidebar.Item active asChild icon={<span>i</span>}>
							<a href="/users" data-testid="active-link">
								Users
							</a>
						</Sidebar.Item>
						<Sidebar.Item asChild icon={<span>i</span>}>
							<a href="/oauth" data-testid="inactive-link">
								OAuth
							</a>
						</Sidebar.Item>
					</Sidebar.Section>
				</Sidebar.Body>
			</Sidebar>,
		);
		const active = screen.getByTestId("active-link");
		const inactive = screen.getByTestId("inactive-link");
		// Active state: primary.700 color + bg-surface background + inset shadow
		expect(active.style.color).toContain("var(--chakra-colors-primary-700)");
		expect(active.style.background).toContain(
			"var(--chakra-colors-bg-surface)",
		);
		expect(active.style.boxShadow).toContain("var(--chakra-colors-border)");
		// Inactive: transparent bg, no shadow
		expect(inactive.style.background).toBe("transparent");
		expect(inactive.style.boxShadow).toBe("");
		expect(inactive.style.color).toContain("var(--chakra-colors-default)");
	});

	it("Sidebar.Item active=true exposes data-active attribute", () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Body>
					<Sidebar.Section label="Identity">
						<Sidebar.Item active icon={<span>i</span>}>
							Users
						</Sidebar.Item>
					</Sidebar.Section>
				</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.getByTestId("sidebar-item")).toHaveAttribute(
			"data-active",
			"true",
		);
	});

	it("Sidebar.Item without active prop has no data-active='true' attribute", () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Body>
					<Sidebar.Section label="Identity">
						<Sidebar.Item icon={<span>i</span>}>Users</Sidebar.Item>
					</Sidebar.Section>
				</Sidebar.Body>
			</Sidebar>,
		);
		const item = screen.getByTestId("sidebar-item");
		expect(item.getAttribute("data-active")).not.toBe("true");
	});

	it("renders Sidebar.UserMenu with user name and email", () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Body />
				<Sidebar.Footer>
					<Sidebar.UserMenu
						user={{ name: "Jana Schmid", email: "jana@knk.de" }}
					>
						<Sidebar.UserMenuItem>Sign out</Sidebar.UserMenuItem>
					</Sidebar.UserMenu>
				</Sidebar.Footer>
			</Sidebar>,
		);
		expect(screen.getByText("Jana Schmid")).toBeInTheDocument();
		expect(screen.getByText("jana@knk.de")).toBeInTheDocument();
	});

	it("opens the user menu on click and renders Sidebar.UserMenuItem children", async () => {
		renderExpanded(
			<Sidebar>
				<Sidebar.Body />
				<Sidebar.Footer>
					<Sidebar.UserMenu user={{ name: "Jana", email: "jana@knk.de" }}>
						<Sidebar.UserMenuItem>Personal Settings</Sidebar.UserMenuItem>
						<Sidebar.UserMenuItem>Sign out</Sidebar.UserMenuItem>
					</Sidebar.UserMenu>
				</Sidebar.Footer>
			</Sidebar>,
		);
		fireEvent.click(screen.getByTestId("sidebar-user-menu-trigger"));
		expect(await screen.findByText("Personal Settings")).toBeInTheDocument();
		expect(screen.getByText("Sign out")).toBeInTheDocument();
	});

	it("Sidebar.UserMenuItem onClick fires", async () => {
		const onClick = vi.fn();
		renderExpanded(
			<Sidebar>
				<Sidebar.Body />
				<Sidebar.Footer>
					<Sidebar.UserMenu user={{ name: "Jana", email: "jana@knk.de" }}>
						<Sidebar.UserMenuItem onClick={onClick}>
							Sign out
						</Sidebar.UserMenuItem>
					</Sidebar.UserMenu>
				</Sidebar.Footer>
			</Sidebar>,
		);
		fireEvent.click(screen.getByTestId("sidebar-user-menu-trigger"));
		fireEvent.click(await screen.findByText("Sign out"));
		expect(onClick).toHaveBeenCalledOnce();
	});

	// ── New tests: collapse state, viewport heuristic, storage, toggle ──

	it("Sidebar starts expanded by default at wide viewport", () => {
		// jsdom default innerWidth is 1024, so without storage this would
		// collapse via heuristic. Set viewport wider than the breakpoint.
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1600,
		});
		renderWithChakra(
			<Sidebar>
				<Sidebar.Body>body</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.getByTestId("sidebar")).toHaveAttribute(
			"data-collapsed",
			"false",
		);
	});

	it("Sidebar honors defaultCollapsed prop when no stored value", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1600,
		});
		renderWithChakra(
			<Sidebar defaultCollapsed>
				<Sidebar.Body>body</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.getByTestId("sidebar")).toHaveAttribute(
			"data-collapsed",
			"true",
		);
	});

	it("Sidebar collapses by default below the 1440px breakpoint", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1280,
		});
		renderWithChakra(
			<Sidebar>
				<Sidebar.Body>body</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.getByTestId("sidebar")).toHaveAttribute(
			"data-collapsed",
			"true",
		);
	});

	it("Sidebar reads stored value from localStorage when storageKey is set", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1600,
		});
		window.localStorage.setItem("test.sidebar.collapsed", "true");
		renderWithChakra(
			<Sidebar storageKey="test.sidebar.collapsed">
				<Sidebar.Body>body</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.getByTestId("sidebar")).toHaveAttribute(
			"data-collapsed",
			"true",
		);
		window.localStorage.removeItem("test.sidebar.collapsed");
	});

	it("Sidebar toggle button flips state and writes to localStorage", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1600,
		});
		renderWithChakra(
			<Sidebar storageKey="test.sidebar.toggle">
				<Sidebar.Body>body</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.getByTestId("sidebar")).toHaveAttribute(
			"data-collapsed",
			"false",
		);
		fireEvent.click(screen.getByTestId("sidebar-toggle"));
		expect(screen.getByTestId("sidebar")).toHaveAttribute(
			"data-collapsed",
			"true",
		);
		expect(window.localStorage.getItem("test.sidebar.toggle")).toBe("true");
		window.localStorage.removeItem("test.sidebar.toggle");
	});

	it("useSidebarContext throws when used outside Sidebar", () => {
		// Suppress the React error boundary log:
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		function Probe() {
			useSidebarContext();
			return null;
		}
		expect(() => render(<Probe />)).toThrow(/useSidebarContext/);
		spy.mockRestore();
	});

	// ── Task 3: Logo compact mode ──

	it("Sidebar.Logo shows compact form when collapsed", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1600,
		});
		renderWithChakra(
			<Sidebar defaultCollapsed>
				<Sidebar.Header>
					<Sidebar.Logo wordmark="Odon" subtitle="Identity Provider" />
				</Sidebar.Header>
				<Sidebar.Body />
			</Sidebar>,
		);
		// First letter rendered, full wordmark and subtitle absent
		expect(screen.getByText("O")).toBeInTheDocument();
		expect(screen.queryByText("Odon")).not.toBeInTheDocument();
		expect(screen.queryByText("Identity Provider")).not.toBeInTheDocument();
	});

	// ── Task 4: Section label hidden when collapsed ──

	it("Sidebar.Section hides its label when collapsed", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1600,
		});
		renderWithChakra(
			<Sidebar defaultCollapsed>
				<Sidebar.Body>
					<Sidebar.Section label="Identity">
						<span data-testid="item">A</span>
					</Sidebar.Section>
				</Sidebar.Body>
			</Sidebar>,
		);
		expect(screen.queryByText("Identity")).not.toBeInTheDocument();
		expect(screen.getByTestId("item")).toBeInTheDocument();
	});

	// ── Task 5: Item icon-only with tooltip when collapsed ──

	it("Sidebar.Item shows icon-only with tooltip when collapsed", async () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1600,
		});
		renderWithChakra(
			<Sidebar defaultCollapsed>
				<Sidebar.Body>
					<Sidebar.Section label="Identity">
						<Sidebar.Item
							icon={<span data-testid="icon">i</span>}
							label="Users"
						>
							Users
						</Sidebar.Item>
					</Sidebar.Section>
				</Sidebar.Body>
			</Sidebar>,
		);
		// Icon present
		expect(screen.getByTestId("icon")).toBeInTheDocument();
		// Visible label hidden in collapsed mode (text "Users" not rendered as item content)
		// Note: getByText would match the tooltip content if portal-rendered;
		// assert via the rendered item box not containing "Users" text:
		const item = screen.getByTestId("sidebar-item");
		expect(item.textContent).not.toContain("Users");
	});

	// ── Task 6: UserMenu avatar-only when collapsed ──

	it("Sidebar.UserMenu shows avatar only when collapsed", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1600,
		});
		renderWithChakra(
			<Sidebar defaultCollapsed>
				<Sidebar.Body />
				<Sidebar.Footer>
					<Sidebar.UserMenu
						user={{ name: "Jana Schmid", email: "jana@knk.de" }}
					>
						<Sidebar.UserMenuItem>Sign out</Sidebar.UserMenuItem>
					</Sidebar.UserMenu>
				</Sidebar.Footer>
			</Sidebar>,
		);
		// Initials present, name and email NOT rendered in trigger
		expect(screen.getByText("JS")).toBeInTheDocument();
		expect(screen.queryByText("Jana Schmid")).not.toBeInTheDocument();
		expect(screen.queryByText("jana@knk.de")).not.toBeInTheDocument();
	});
});
