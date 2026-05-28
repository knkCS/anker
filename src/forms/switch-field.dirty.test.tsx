import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { SwitchField } from "./switch-field";

function Harness({ showDirtyState }: { showDirtyState?: boolean }) {
	const form = useForm({ defaultValues: { enabled: false } });
	useEffect(() => {
		form.setValue("enabled", true, { shouldDirty: true });
	}, [form]);
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>
				<SwitchField
					name="enabled"
					label="Enabled"
					showDirtyState={showDirtyState}
				/>
			</FormProvider>
		</ChakraProvider>
	);
}

describe("SwitchField — dirty marker", () => {
	it("renders the dirty marker dot when dirty", () => {
		const { getByLabelText } = render(<Harness />);
		expect(getByLabelText("ungespeicherte Änderung")).toBeInTheDocument();
	});

	it("suppresses the marker when showDirtyState is false", () => {
		const { queryByLabelText } = render(<Harness showDirtyState={false} />);
		expect(queryByLabelText("ungespeicherte Änderung")).toBeNull();
	});
});
