import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { RadioGroupField } from "./radio-group-field";

function Harness({
	showDirtyState,
}: {
	showDirtyState?: boolean;
}) {
	const form = useForm({ defaultValues: { pick: "x" } });
	useEffect(() => {
		form.setValue("pick", "y", { shouldDirty: true });
	}, [form]);
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>
				<RadioGroupField
					name="pick"
					label="Pick one"
					options={[
						{ value: "x", label: "X" },
						{ value: "y", label: "Y" },
					]}
					showDirtyState={showDirtyState}
				/>
			</FormProvider>
		</ChakraProvider>
	);
}

describe("RadioGroupField — dirty marker", () => {
	it("renders the dirty marker dot when dirty", () => {
		const { getByLabelText } = render(<Harness />);
		expect(getByLabelText("ungespeicherte Änderung")).toBeInTheDocument();
	});

	it("suppresses the marker when showDirtyState is false", () => {
		const { queryByLabelText } = render(<Harness showDirtyState={false} />);
		expect(queryByLabelText("ungespeicherte Änderung")).toBeNull();
	});
});
