import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { DirtyCounter } from "./dirty-counter";

function Harness({
	dirtyCount,
	label,
	hideWhenClean,
}: {
	dirtyCount: number;
	label?: string;
	hideWhenClean?: boolean;
}) {
	const form = useForm({
		defaultValues: { f0: "x", f1: "x", f2: "x" },
	});
	useEffect(() => {
		const keys: Array<"f0" | "f1" | "f2"> = ["f0", "f1", "f2"];
		for (let i = 0; i < dirtyCount; i++) {
			form.setValue(keys[i], "y", { shouldDirty: true });
		}
	}, [form, dirtyCount]);
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>
				<DirtyCounter label={label} hideWhenClean={hideWhenClean} />
			</FormProvider>
		</ChakraProvider>
	);
}

describe("DirtyCounter", () => {
	it("renders nothing when no fields are dirty (default)", () => {
		const { container } = render(<Harness dirtyCount={0} />);
		expect(container.textContent).toBe("");
	});

	it("renders the count with the default German label when dirty", () => {
		const { container } = render(<Harness dirtyCount={2} />);
		expect(container.textContent).toContain("2 ungespeicherte Änderungen");
	});

	it("respects a custom label template with {count}", () => {
		const { container } = render(
			<Harness dirtyCount={1} label="{count} unsaved" />,
		);
		expect(container.textContent).toContain("1 unsaved");
	});

	it("renders the chip with count=0 when hideWhenClean is false", () => {
		const { container } = render(
			<Harness dirtyCount={0} hideWhenClean={false} />,
		);
		expect(container.textContent).toContain("0 ungespeicherte Änderungen");
	});
});
