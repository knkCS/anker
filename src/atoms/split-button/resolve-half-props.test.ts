import { describe, expect, it, vi } from "vitest";
import { resolveHalfProps } from "./resolve-half-props";

const base = {
	onClick: () => {},
	menuAriaLabel: "Choose a task type",
};

describe("resolveHalfProps", () => {
	it("forwards the consumer's styling props to both halves", () => {
		const { action, trigger } = resolveHalfProps({
			...base,
			size: "sm",
			variant: "solid",
			colorPalette: "gray",
		});

		expect(action).toMatchObject({
			size: "sm",
			variant: "solid",
			colorPalette: "gray",
		});
		expect(trigger).toMatchObject({
			size: "sm",
			variant: "solid",
			colorPalette: "gray",
		});
	});

	it("omits styling props that were not passed rather than setting them undefined", () => {
		// Button applies `size="md"` / `variant="secondary"` BEFORE its own spread,
		// so forwarding an explicit `undefined` would clobber them and fall through
		// to the recipe's defaultVariants — where `size` is "lg".
		const { action, trigger } = resolveHalfProps(base);

		for (const key of [
			"size",
			"variant",
			"colorPalette",
			"loading",
			"disabled",
		]) {
			expect(action).not.toHaveProperty(key);
		}
		for (const key of ["size", "variant", "colorPalette"]) {
			expect(trigger).not.toHaveProperty(key);
		}
	});

	it("wires the default action to the action half only", () => {
		const onClick = vi.fn();

		const { action, trigger } = resolveHalfProps({ ...base, onClick });

		expect(action.onClick).toBe(onClick);
		expect(trigger.onClick).toBeUndefined();
	});

	it("names the icon-only trigger", () => {
		const { trigger } = resolveHalfProps(base);

		expect(trigger["aria-label"]).toBe("Choose a task type");
	});

	it("joins the two halves at the seam", () => {
		const { action, trigger } = resolveHalfProps(base);

		expect(action.borderEndRadius).toBe("none");
		expect(trigger.borderStartRadius).toBe("none");
	});

	it("does not let a consumer supply the seam radii", () => {
		// The type already excludes them — `SplitButtonStyleProps` picks neither —
		// so this pins the runtime half of that promise: the structural props are
		// applied AFTER the forwarded ones and cannot be spread over. Casting is
		// how a consumer would get here in JS, or via `as any` in TS.
		const { action, trigger } = resolveHalfProps({
			...base,
			borderEndRadius: "full",
			borderStartRadius: "full",
		} as Parameters<typeof resolveHalfProps>[0]);

		expect(action.borderEndRadius).toBe("none");
		expect(trigger.borderStartRadius).toBe("none");
	});

	it("puts the spinner on the action half and only disables the trigger", () => {
		// Two spinners would read as two pending actions, and the trigger's would
		// replace the chevron.
		const { action, trigger } = resolveHalfProps({ ...base, loading: true });

		expect(action.loading).toBe(true);
		expect(trigger.loading).toBe(false);
		expect(trigger.disabled).toBe(true);
	});

	it("disables both halves when disabled", () => {
		const { action, trigger } = resolveHalfProps({ ...base, disabled: true });

		expect(action.disabled).toBe(true);
		expect(trigger.disabled).toBe(true);
	});

	it("leaves the trigger enabled when neither disabled nor loading", () => {
		const { trigger } = resolveHalfProps(base);

		expect(trigger.disabled).toBe(false);
		expect(trigger.loading).toBe(false);
	});
});
