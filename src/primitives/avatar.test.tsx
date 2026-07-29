// src/primitives/avatar.test.tsx
import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { ruleTextFor } from "../test/recipe-styles";
import { createAnkerTheme } from "../theme/create-theme";
import { Avatar } from "./avatar";

// The anker system is required (not defaultSystem): the `avatarPresence` recipe
// exists only in anker's theme, and the recipe-consumption test asserts its
// styles actually land in the DOM.
const system = createAnkerTheme();
function renderWithAnkerTheme(ui: ReactElement) {
	return render(<ChakraProvider value={system}>{ui}</ChakraProvider>);
}

function presenceRuleText() {
	return ruleTextFor(screen.getByTestId("avatar-presence"));
}

describe("Avatar presence", () => {
	it("names the online dot for screen readers, since a dot says nothing", () => {
		renderWithAnkerTheme(<Avatar name="Jane Doe" presence="online" />);
		expect(screen.getByRole("img", { name: "Online" })).toBeInTheDocument();
	});

	it("consumes the registered `avatarPresence` recipe (guard against dead recipes)", () => {
		// Recipe styles are emitted under `@layer recipes`, which jsdom's computed
		// styles cannot resolve — so assert on the injected stylesheet: the dot's
		// generated class must carry the recipe's own fill. This only holds if the
		// recipe is registered in create-theme.ts AND the component consumes it.
		renderWithAnkerTheme(<Avatar name="Jane Doe" presence="online" />);
		expect(presenceRuleText()).toContain("var(--chakra-colors-success)");
	});

	it("distinguishes offline by shape, not hue alone (WCAG 1.4.1)", () => {
		renderWithAnkerTheme(<Avatar name="Jane Doe" presence="offline" />);
		const rules = presenceRuleText();
		// Hollow: an inward ring rather than the online fill. Greyscale-readable.
		expect(rules).toContain("inset 0 0 0 2px var(--chakra-colors-subtle)");
		expect(rules).not.toContain("var(--chakra-colors-success)");
	});

	it("names the offline dot distinctly", () => {
		renderWithAnkerTheme(<Avatar name="Jane Doe" presence="offline" />);
		expect(screen.getByRole("img", { name: "Offline" })).toBeInTheDocument();
		expect(screen.getByTestId("avatar-presence")).toHaveAttribute(
			"data-presence",
			"offline",
		);
	});

	it("accepts a translated label that replaces the English default", () => {
		renderWithAnkerTheme(
			<Avatar name="Jane Doe" presence="online" presenceLabel="Verfügbar" />,
		);
		expect(screen.getByRole("img", { name: "Verfügbar" })).toBeInTheDocument();
		expect(
			screen.queryByRole("img", { name: "Online" }),
		).not.toBeInTheDocument();
	});
});

describe("Avatar without presence (non-breaking)", () => {
	it("renders no indicator at all when the prop is absent", () => {
		// Absent is not offline: an avatar with nothing to say about presence
		// renders exactly as it did before the variant existed.
		renderWithAnkerTheme(<Avatar name="Jane Doe" />);
		expect(screen.queryByTestId("avatar-presence")).not.toBeInTheDocument();
	});

	it("leaves the existing markup untouched", () => {
		// `useId` counts up per render, so ids differ between the two mounts and
		// say nothing about the presence variant.
		const withoutIds = (html: string) =>
			html.replace(/_r_[0-9a-z]+_/g, "_r_X_");
		const { container } = renderWithAnkerTheme(<Avatar name="Jane Doe" />);
		const withPresence = renderWithAnkerTheme(
			<Avatar name="Jane Doe" presence="online" />,
		);
		const dot = withPresence.getByTestId("avatar-presence");
		// The presence markup is purely additive: remove the dot and the two
		// renders are byte-identical, class names included — so no existing
		// consumer's DOM or styling shifts.
		dot.remove();
		expect(withoutIds(withPresence.container.innerHTML)).toBe(
			withoutIds(container.innerHTML),
		);
	});

	it("still forwards name, image and children to the Chakra root", () => {
		const { container } = renderWithAnkerTheme(
			<Avatar name="Jane Doe" src="https://example.test/jane.png">
				<span data-testid="child" />
			</Avatar>,
		);
		expect(screen.getByTestId("child")).toBeInTheDocument();
		expect(container.querySelector("img")).toHaveAttribute(
			"src",
			"https://example.test/jane.png",
		);
		expect(screen.getByText("JD")).toBeInTheDocument();
	});

	it("keeps `presence` off the DOM root, so it never leaks as an attribute", () => {
		const { container } = renderWithAnkerTheme(
			<Avatar name="Jane Doe" presence="online" />,
		);
		expect(container.firstElementChild).not.toHaveAttribute("presence");
		expect(container.firstElementChild).not.toHaveAttribute("presencelabel");
	});
});

describe("displayName", () => {
	it("is set", () => {
		expect(Avatar.displayName).toBe("Avatar");
	});
});
