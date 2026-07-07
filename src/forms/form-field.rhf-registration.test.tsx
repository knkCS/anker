import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { act, render, screen } from "@testing-library/react";
import { createRef, useEffect } from "react";
import { FormProvider, type UseFormReturn, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { InputField } from "./input-field";
import { TextareaField } from "./textarea-field";

// react-hook-form's setFocus() defers the actual DOM `.focus()` call inside a
// `setTimeout(0)` (see RHF's internal `setFocus`), so a synchronous `act()`
// isn't enough to observe the result — flush a real timer tick as well.
async function flushSetFocus() {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
}

function Harness({
	onForm,
	children,
}: {
	onForm?: (form: UseFormReturn<{ name: string }>) => void;
	children: React.ReactNode;
}) {
	const form = useForm({ defaultValues: { name: "" } });
	useEffect(() => {
		onForm?.(form);
	}, [form, onForm]);
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>{children}</FormProvider>
		</ChakraProvider>
	);
}

describe("form wrappers — DOM name + RHF registration", () => {
	it("the rendered input carries the name attribute", () => {
		render(
			<Harness>
				<InputField name="name" label="Name" />
			</Harness>,
		);
		const input = screen.getByLabelText(/^Name/) as HTMLInputElement;
		expect(input).toHaveAttribute("name", "name");
	});

	it("RHF setFocus reaches the input (field.ref registered)", async () => {
		let form: UseFormReturn<{ name: string }> | undefined;
		render(
			<Harness onForm={(f) => (form = f)}>
				<InputField name="name" label="Name" />
			</Harness>,
		);
		act(() => {
			form?.setFocus("name");
		});
		await flushSetFocus();
		expect(screen.getByLabelText(/^Name/)).toHaveFocus();
	});

	it("a consumer ref and field.ref coexist", async () => {
		const consumerRef = createRef<HTMLInputElement>();
		let form: UseFormReturn<{ name: string }> | undefined;
		render(
			<Harness onForm={(f) => (form = f)}>
				<InputField name="name" label="Name" ref={consumerRef} />
			</Harness>,
		);
		// Consumer ref sees the element…
		expect(consumerRef.current).toBeInstanceOf(HTMLInputElement);
		// …and RHF is registered too.
		act(() => {
			form?.setFocus("name");
		});
		await flushSetFocus();
		expect(consumerRef.current).toHaveFocus();
	});

	it("TextareaField: name attribute + setFocus (representative second wrapper)", async () => {
		let form: UseFormReturn<{ name: string }> | undefined;
		render(
			<Harness onForm={(f) => (form = f)}>
				<TextareaField name="name" label="Notes" />
			</Harness>,
		);
		const area = screen.getByLabelText(/^Notes/);
		expect(area).toHaveAttribute("name", "name");
		act(() => {
			form?.setFocus("name");
		});
		await flushSetFocus();
		expect(area).toHaveFocus();
	});
});
