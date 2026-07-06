import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createAnkerToaster, Toaster, toaster } from "./toaster";

function Host({ showFirst = true }: { showFirst?: boolean }) {
	return (
		<ChakraProvider value={defaultSystem}>
			{showFirst && <Toaster />}
			<Toaster />
		</ChakraProvider>
	);
}

describe("Toaster — mount dedupe", () => {
	it("renders each toast once with two mounted default Toasters", async () => {
		render(<Host />);
		await act(async () => {
			toaster.create({ title: "dedupe-one", duration: 60_000 });
		});
		expect(await screen.findAllByText("dedupe-one")).toHaveLength(1);
	});

	it("the survivor takes over when the owning Toaster unmounts", async () => {
		const { rerender } = render(<Host showFirst />);
		await act(async () => {
			toaster.create({ title: "before-unmount", duration: 60_000 });
		});
		expect(await screen.findAllByText("before-unmount")).toHaveLength(1);

		rerender(<Host showFirst={false} />);
		await act(async () => {
			toaster.create({ title: "after-unmount", duration: 60_000 });
		});
		expect(await screen.findAllByText("after-unmount")).toHaveLength(1);
	});

	it("custom pairs dedupe independently of the default pair", async () => {
		const pair = createAnkerToaster();
		render(
			<ChakraProvider value={defaultSystem}>
				<Toaster />
				<pair.Toaster />
				<pair.Toaster />
			</ChakraProvider>,
		);
		await act(async () => {
			pair.toaster.create({ title: "custom-toast", duration: 60_000 });
			toaster.create({ title: "default-toast", duration: 60_000 });
		});
		expect(await screen.findAllByText("custom-toast")).toHaveLength(1);
		expect(await screen.findAllByText("default-toast")).toHaveLength(1);
	});
});
