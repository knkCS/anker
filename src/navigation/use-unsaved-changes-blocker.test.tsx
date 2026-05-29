// @vitest-environment happy-dom
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { useNavigate } from "react-router-dom";
import {
	RouterProvider,
	createMemoryRouter,
} from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useUnsavedChangesBlocker } from "./use-unsaved-changes-blocker";

function makeRouter(opts: {
	isDirty: boolean;
	safePathPrefix?: string;
	initial?: string;
}) {
	function Probe() {
		const navigate = useNavigate();
		const blocker = useUnsavedChangesBlocker(opts.isDirty, {
			safePathPrefix: opts.safePathPrefix,
		});
		return (
			<>
				<span data-testid="state">{blocker.state}</span>
				<button
					type="button"
					data-testid="goto-external"
					onClick={() => navigate("/other")}
				>
					external
				</button>
				<button
					type="button"
					data-testid="goto-safe"
					onClick={() => navigate("/detail/abc/editor")}
				>
					safe
				</button>
			</>
		);
	}
	return createMemoryRouter(
		[
			{ path: "/detail/abc/general", element: <Probe /> },
			{ path: "/detail/abc/editor", element: <span>editor</span> },
			{ path: "/other", element: <span>other</span> },
		],
		{ initialEntries: [opts.initial ?? "/detail/abc/general"] },
	);
}

function renderRouter(router: ReturnType<typeof createMemoryRouter>) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<RouterProvider router={router} />
		</ChakraProvider>,
	);
}

describe("useUnsavedChangesBlocker", () => {
	it("never blocks when isDirty is false", async () => {
		const router = makeRouter({ isDirty: false });
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("goto-external").click();
		});
		expect(screen.getByText("other")).toBeTruthy();
	});

	it("blocks external navigation when isDirty is true", async () => {
		const router = makeRouter({ isDirty: true });
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("goto-external").click();
		});
		expect(screen.getByTestId("state").textContent).toBe("blocked");
	});

	it("allows navigation to paths under safePathPrefix even when dirty", async () => {
		const router = makeRouter({
			isDirty: true,
			safePathPrefix: "/detail/abc/",
		});
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("goto-safe").click();
		});
		expect(screen.getByText("editor")).toBeTruthy();
	});
});
