// src/components/auth-card.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthCard } from "./auth-card";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("AuthCard", () => {
	it("renders the title", () => {
		renderWithChakra(
			<AuthCard title="Sign in">
				<div>body</div>
			</AuthCard>,
		);
		expect(
			screen.getByRole("heading", { name: "Sign in" }),
		).toBeInTheDocument();
	});

	it("renders the children inside the card body", () => {
		renderWithChakra(
			<AuthCard title="Sign in">
				<button type="button">Continue</button>
			</AuthCard>,
		);
		expect(
			screen.getByRole("button", { name: "Continue" }),
		).toBeInTheDocument();
	});

	it("renders subtitle when provided", () => {
		renderWithChakra(
			<AuthCard title="Sign in" subtitle="Enter your email">
				<div />
			</AuthCard>,
		);
		expect(screen.getByText("Enter your email")).toBeInTheDocument();
	});

	it("renders eyebrow when provided", () => {
		renderWithChakra(
			<AuthCard eyebrow="ANMELDUNG" title="Sign in">
				<div />
			</AuthCard>,
		);
		expect(screen.getByText("ANMELDUNG")).toBeInTheDocument();
	});

	it("renders footer when provided", () => {
		renderWithChakra(
			<AuthCard title="Sign in" footer={<a href="/register">Sign up</a>}>
				<div />
			</AuthCard>,
		);
		expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
	});

	it("does not render footer when not provided", () => {
		renderWithChakra(
			<AuthCard title="Sign in">
				<div />
			</AuthCard>,
		);
		expect(screen.queryByTestId("auth-card-footer")).not.toBeInTheDocument();
	});

	it("renders logo and topBarRight slots in the topbar", () => {
		renderWithChakra(
			<AuthCard
				logo={<span>knk</span>}
				topBarRight={<a href="/help">Help</a>}
				title="Sign in"
			>
				<div />
			</AuthCard>,
		);
		expect(screen.getByText("knk")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Help" })).toBeInTheDocument();
	});

	it("hides the topbar when hideTopBar=true", () => {
		renderWithChakra(
			<AuthCard hideTopBar logo={<span>knk</span>} title="Sign in">
				<div />
			</AuthCard>,
		);
		expect(screen.queryByText("knk")).not.toBeInTheDocument();
	});

	it("exposes data-size='md' by default", () => {
		renderWithChakra(
			<AuthCard title="Sign in">
				<div />
			</AuthCard>,
		);
		expect(screen.getByTestId("auth-card")).toHaveAttribute("data-size", "md");
	});

	it("exposes data-size='lg' when size='lg'", () => {
		renderWithChakra(
			<AuthCard size="lg" title="Sign in">
				<div />
			</AuthCard>,
		);
		expect(screen.getByTestId("auth-card")).toHaveAttribute("data-size", "lg");
	});

	it("exposes data-background='hidden' when hideBackground=true", () => {
		renderWithChakra(
			<AuthCard hideBackground title="Sign in">
				<div />
			</AuthCard>,
		);
		expect(screen.getByTestId("auth-card-canvas")).toHaveAttribute(
			"data-background",
			"hidden",
		);
	});
});
