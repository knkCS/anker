// src/components/nav-list/nav-list.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
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
});
