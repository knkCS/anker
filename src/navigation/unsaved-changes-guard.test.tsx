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
import { UnsavedChangesGuard } from "./unsaved-changes-guard";

function makeRouter(isDirty: boolean) {
	function Probe() {
		const navigate = useNavigate();
		return (
			<>
				<UnsavedChangesGuard
					isDirty={isDirty}
					title="Test title"
					message="Test message"
					confirmLabel="Leave!"
					cancelLabel="Stay!"
				/>
				<button
					type="button"
					data-testid="leave"
					onClick={() => navigate("/elsewhere")}
				>
					leave
				</button>
			</>
		);
	}
	return createMemoryRouter(
		[
			{ path: "/start", element: <Probe /> },
			{ path: "/elsewhere", element: <span>elsewhere</span> },
		],
		{ initialEntries: ["/start"] },
	);
}

function renderRouter(router: ReturnType<typeof createMemoryRouter>) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<RouterProvider router={router} />
		</ChakraProvider>,
	);
}

describe("UnsavedChangesGuard", () => {
	it("does not interrupt navigation when isDirty is false", async () => {
		const router = makeRouter(false);
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("leave").click();
		});
		expect(screen.getByText("elsewhere")).toBeTruthy();
	});

	it("renders the dialog with supplied labels when dirty navigation is attempted", async () => {
		const router = makeRouter(true);
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("leave").click();
		});
		expect(screen.getByText("Test title")).toBeTruthy();
		expect(screen.getByText("Test message")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Leave!" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Stay!" })).toBeTruthy();
	});

	it("proceeds with navigation when the user confirms", async () => {
		const router = makeRouter(true);
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("leave").click();
		});
		await act(async () => {
			screen.getByRole("button", { name: "Leave!" }).click();
		});
		expect(screen.getByText("elsewhere")).toBeTruthy();
	});

	it("stays on the page when the user cancels", async () => {
		const router = makeRouter(true);
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("leave").click();
		});
		await act(async () => {
			screen.getByRole("button", { name: "Stay!" }).click();
		});
		expect(screen.queryByText("elsewhere")).toBeNull();
		expect(screen.getByTestId("leave")).toBeTruthy();
	});
});
