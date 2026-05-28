import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { useFieldDirty } from "./use-field-dirty";

function wrapper(defaults: Record<string, string>) {
	return ({ children }: { children: ReactNode }) => {
		const form = useForm({ defaultValues: defaults });
		return <FormProvider {...form}>{children}</FormProvider>;
	};
}

describe("useFieldDirty", () => {
	it("returns false when field value equals its default", () => {
		const { result } = renderHook(() => useFieldDirty("name"), {
			wrapper: wrapper({ name: "alpha" }),
		});
		expect(result.current).toBe(false);
	});

	it("returns false when showDirtyState is false", () => {
		const { result } = renderHook(
			() => useFieldDirty("name", { showDirtyState: false }),
			{ wrapper: wrapper({ name: "alpha" }) },
		);
		expect(result.current).toBe(false);
	});

	it("returns false when called outside a FormProvider", () => {
		// useFormContext returns null outside provider; hook must tolerate it.
		const { result } = renderHook(() => useFieldDirty("name"));
		expect(result.current).toBe(false);
	});
});
