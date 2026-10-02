import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DynamicIcon } from "./dynamic-icon";

const svgOf = (container: HTMLElement) => container.querySelector("svg");

describe("DynamicIcon", () => {
	it("renders the lucide icon a stored name names", async () => {
		const { container } = render(<DynamicIcon name="banknote" />);
		await waitFor(() =>
			expect(svgOf(container)).toHaveClass("lucide-banknote"),
		);
		expect(svgOf(container)).toHaveAttribute("data-state", "loaded");
	});

	it("renders a neutral fallback for an unknown name", async () => {
		const { container } = render(<DynamicIcon name="not-an-icon" />);
		await waitFor(() =>
			expect(svgOf(container)).toHaveAttribute("data-state", "fallback"),
		);
		expect(svgOf(container)).toHaveClass("lucide-circle-dashed");
	});

	it("renders the fallback at once for an empty name", () => {
		const { container } = render(<DynamicIcon name={null} />);
		expect(svgOf(container)).toHaveAttribute("data-state", "fallback");
	});

	it("takes a custom fallback", async () => {
		render(<DynamicIcon name="not-an-icon" fallback={<span>no icon</span>} />);
		expect(await screen.findByText("no icon")).toBeInTheDocument();
	});

	it("follows a name lucide has since renamed", async () => {
		const { container } = render(<DynamicIcon name="alert-triangle" />);
		await waitFor(() =>
			expect(svgOf(container)).toHaveClass("lucide-triangle-alert"),
		);
	});

	it("holds the icon's box while loading", () => {
		const { container } = render(<DynamicIcon name="anchor" size={20} />);
		const svg = svgOf(container);
		// First frame, before the chunk resolves (or already cached).
		expect(svg).toHaveAttribute("width", "20");
		expect(svg).toHaveAttribute("height", "20");
	});

	it("passes lucide props through", async () => {
		const { container } = render(
			<DynamicIcon name="banknote" size={32} strokeWidth={1.5} />,
		);
		await waitFor(() =>
			expect(svgOf(container)).toHaveClass("lucide-banknote"),
		);
		expect(svgOf(container)).toHaveAttribute("width", "32");
		expect(svgOf(container)).toHaveAttribute("stroke-width", "1.5");
	});

	it("is decorative by default and an image when labelled", async () => {
		const { container, rerender } = render(<DynamicIcon name="banknote" />);
		await waitFor(() =>
			expect(svgOf(container)).toHaveAttribute("data-state", "loaded"),
		);
		expect(svgOf(container)).toHaveAttribute("aria-hidden", "true");

		rerender(<DynamicIcon name="banknote" aria-label="Payments" />);
		expect(screen.getByRole("img", { name: "Payments" })).toBeInTheDocument();
	});

	it("renders a cached icon on the first frame", async () => {
		const first = render(<DynamicIcon name="banknote" />);
		await waitFor(() =>
			expect(svgOf(first.container)).toHaveAttribute("data-state", "loaded"),
		);
		first.unmount();
		const { container } = render(<DynamicIcon name="banknote" />);
		expect(svgOf(container)).toHaveAttribute("data-state", "loaded");
	});
});
