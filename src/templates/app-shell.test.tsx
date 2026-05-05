// src/templates/app-shell.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AppShell, usePageRail } from "./app-shell";

function renderWithChakra(ui: ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

function RailRegistrar() {
	usePageRail(<div data-testid="rail-content">registered rail</div>);
	return <div data-testid="page-body">body</div>;
}

describe("AppShell", () => {
	it("renders the sidebar", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb">sidebar</div>}>
				<div>main</div>
			</AppShell>,
		);
		expect(screen.getByTestId("sb")).toBeInTheDocument();
	});

	it("drops the rail column when no rail prop is supplied and no descendant registers content", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<div>main</div>
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell")).toHaveAttribute(
			"data-rail",
			"false",
		);
	});

	it("renders the rail prop when no descendant registers content", () => {
		renderWithChakra(
			<AppShell
				sidebar={<div data-testid="sb" />}
				rail={<div data-testid="prop-rail">from prop</div>}
			>
				<div>main</div>
			</AppShell>,
		);
		expect(screen.getByTestId("prop-rail")).toBeInTheDocument();
	});

	it("renders rail content registered by a descendant via usePageRail", () => {
		// Regression for #119: AppShell consumed its own slot store at the same
		// level it provided it, so the rail column never picked up content
		// registered by descendants. Splitting the consumer out of the provider
		// fixes this.
		renderWithChakra(
			<AppShell
				sidebar={<div data-testid="sb" />}
				rail={<div data-testid="prop-rail">from prop</div>}
			>
				<RailRegistrar />
			</AppShell>,
		);
		expect(screen.getByTestId("rail-content")).toBeInTheDocument();
		// Registered content wins over the prop fallback.
		expect(screen.queryByTestId("prop-rail")).not.toBeInTheDocument();
	});

	it("registered rail content shows even when no rail prop was passed", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<RailRegistrar />
			</AppShell>,
		);
		expect(screen.getByTestId("rail-content")).toBeInTheDocument();
		expect(screen.getByTestId("app-shell")).toHaveAttribute(
			"data-rail",
			"true",
		);
	});
});
