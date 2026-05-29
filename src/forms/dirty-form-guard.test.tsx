// @vitest-environment happy-dom
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import {
	RouterProvider,
	createMemoryRouter,
	useNavigate,
} from "react-router-dom";

import { DirtyFormGuard } from "./dirty-form-guard";

function makeRouter(opts: { defaultDirty: boolean; safePathPrefix?: string }) {
	function FormHost() {
		const form = useForm<{ name: string }>({
			defaultValues: { name: opts.defaultDirty ? "" : "saved" },
		});
		// Make the form "dirty" by changing a value at mount if requested.
		if (opts.defaultDirty) {
			form.setValue("name", "typed", { shouldDirty: true });
		}
		const navigate = useNavigate();
		return (
			<FormProvider {...form}>
				<DirtyFormGuard
					safePathPrefix={opts.safePathPrefix}
					title="Form title"
					message="Form message"
					confirmLabel="Leave"
					cancelLabel="Stay"
				/>
				<button
					type="button"
					data-testid="external"
					onClick={() => navigate("/elsewhere")}
				>
					external
				</button>
				<button
					type="button"
					data-testid="safe"
					onClick={() => navigate("/detail/abc/editor")}
				>
					safe
				</button>
			</FormProvider>
		);
	}
	return createMemoryRouter(
		[
			{ path: "/detail/abc/general", element: <FormHost /> },
			{ path: "/detail/abc/editor", element: <span>editor</span> },
			{ path: "/elsewhere", element: <span>elsewhere</span> },
		],
		{ initialEntries: ["/detail/abc/general"] },
	);
}

function renderRouter(router: ReturnType<typeof createMemoryRouter>) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<RouterProvider router={router} />
		</ChakraProvider>,
	);
}

describe("DirtyFormGuard", () => {
	it("blocks external navigation when the form is dirty (no opts)", async () => {
		const router = makeRouter({ defaultDirty: true });
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("external").click();
		});
		expect(screen.getByText("Form title")).toBeTruthy();
	});

	it("does not block when the form is clean", async () => {
		const router = makeRouter({ defaultDirty: false });
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("external").click();
		});
		expect(screen.getByText("elsewhere")).toBeTruthy();
	});

	it("allows safePathPrefix navigation even when dirty", async () => {
		const router = makeRouter({
			defaultDirty: true,
			safePathPrefix: "/detail/abc/",
		});
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("safe").click();
		});
		expect(screen.getByText("editor")).toBeTruthy();
	});
});
