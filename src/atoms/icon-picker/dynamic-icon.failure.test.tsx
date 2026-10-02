import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// A chunk that fails to load (a 404 after a deploy, a dropped network).
let fail = true;
vi.mock("lucide-react/dynamicIconImports.js", async () => {
	const { Anchor } = await import("lucide-react");
	return {
		default: {
			anchor: () =>
				fail
					? Promise.reject(new Error("chunk failed"))
					: Promise.resolve({ default: Anchor }),
		},
	};
});

const { DynamicIcon } = await import("./dynamic-icon");

describe("DynamicIcon when an icon chunk fails", () => {
	it("shows the fallback, then retries on a later mount", async () => {
		const first = render(<DynamicIcon name="anchor" />);
		await waitFor(() =>
			expect(first.container.querySelector("svg")).toHaveAttribute(
				"data-state",
				"fallback",
			),
		);
		first.unmount();

		fail = false;
		const second = render(<DynamicIcon name="anchor" />);
		await waitFor(() =>
			expect(second.container.querySelector("svg")).toHaveClass(
				"lucide-anchor",
			),
		);
	});
});
