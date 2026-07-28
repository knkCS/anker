import { describe, expect, it } from "vitest";
import { createAnkerTheme } from "./create-theme";

/**
 * Registration pins for anker#153: Chakra v3's Input is SINGLE-PART and
 * resolves the plain `recipes.input` (InputAddon resolves
 * `recipes.inputAddon`). A v2-style registration under `slotRecipes.input`
 * is silently dead — Chakra's default (`outline` bg: "transparent")
 * applies and every text input renders transparent. These tests read the
 * COMPOSED system the way Chakra's components do (`getRecipe`), so a
 * regression to the dead registration fails them immediately.
 */
describe("createAnkerTheme recipe registration (#153)", () => {
	const system = createAnkerTheme();

	it("resolves the PLAIN input recipe with anker's outline bg", () => {
		const input = system.getRecipe("input");
		expect(input).toBeDefined();
		// Chakra's v3 default is bg: "transparent" — seeing it here means
		// anker's input styles are registered somewhere v3 never reads.
		expect(input.variants?.variant?.outline?.bg).toEqual({
			base: "white",
			_dark: "gray.800",
		});
	});

	it("resolves inputAddon with anker's addon styles", () => {
		const addon = system.getRecipe("inputAddon");
		expect(addon?.variants?.variant?.outline?.bg).toEqual({
			base: "gray.50",
			_dark: "gray.700",
		});
	});

	it("registers NO slot recipe under 'input' (v3 has none; one appearing is a dead v2 registration)", () => {
		expect(system.getSlotRecipe("input", null)).toBeNull();
	});

	it("control: textarea (the known-good plain-recipe sibling) resolves the same way", () => {
		expect(
			system.getRecipe("textarea")?.variants?.variant?.outline?.bg,
		).toEqual({
			base: "white",
			_dark: "gray.800",
		});
	});

	it("dialog backdrop carries the frosted-glass blur (ported from the dead modal recipe)", () => {
		const dialog = system.getSlotRecipe("dialog", null);
		expect(dialog?.base?.backdrop?.backdropFilter).toBe("blur(4px)");
	});

	it("resolves the PLAIN unreadBadge recipe with both count states (#161)", () => {
		// UnreadBadge reads this key by hand via `useRecipe`, so a stray move to
		// `slotRecipes` would leave the pill unstyled rather than erroring.
		const unreadBadge = system.getRecipe("unreadBadge");
		expect(unreadBadge?.base?.bg).toBe("gray.solid");
		expect(unreadBadge?.variants?.mention?.true?.bg).toBe("primary.solid");
	});

	it("registers NO slot recipe under 'unreadBadge' (it is single-part)", () => {
		expect(system.getSlotRecipe("unreadBadge", null)).toBeNull();
	});
});
