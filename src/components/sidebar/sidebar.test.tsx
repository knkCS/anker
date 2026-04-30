// src/components/sidebar/sidebar.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
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
		renderWithChakra(
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
		renderWithChakra(
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
		renderWithChakra(
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
		renderWithChakra(
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
		renderWithChakra(
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

	it("Sidebar.Item active=true exposes data-active attribute", () => {
		renderWithChakra(
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
		renderWithChakra(
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
		renderWithChakra(
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
		renderWithChakra(
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
		renderWithChakra(
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
});
