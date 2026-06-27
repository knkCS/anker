import { describe, expect, it } from "vitest";
import { createWidgetRegistry, isWidgetAvailable } from "./registry";
import type { WidgetDefinition } from "./types";

const make = (over: Partial<WidgetDefinition>): WidgetDefinition => ({
	type: "t",
	name: "T",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	Component: () => null,
	...over,
});

describe("createWidgetRegistry", () => {
	it("get / getAll return registered definitions", () => {
		const a = make({ type: "a" });
		const b = make({ type: "b" });
		const reg = createWidgetRegistry([a, b]);
		expect(reg.get("a")).toBe(a);
		expect(reg.get("missing")).toBeUndefined();
		expect(reg.getAll()).toHaveLength(2);
	});

	it("getCatalog filters by required permission tokens", () => {
		const open = make({ type: "open" });
		const gated = make({ type: "gated", requiredPermissions: ["admin"] });
		const reg = createWidgetRegistry([open, gated]);
		expect(reg.getCatalog([]).map((d) => d.type)).toEqual(["open"]);
		expect(reg.getCatalog(["admin"]).map((d) => d.type)).toEqual([
			"open",
			"gated",
		]);
	});

	it("getCatalog honors the isAvailable predicate", () => {
		const def = make({ type: "flag", isAvailable: (ctx) => ctx === "on" });
		const reg = createWidgetRegistry([def]);
		expect(reg.getCatalog([], "off")).toHaveLength(0);
		expect(reg.getCatalog([], "on")).toHaveLength(1);
	});

	it("getCatalog() with no arguments hides permission-gated widgets", () => {
		const open = make({ type: "open" });
		const gated = make({ type: "gated", requiredPermissions: ["admin"] });
		const reg = createWidgetRegistry([open, gated]);
		expect(reg.getCatalog().map((d) => d.type)).toEqual(["open"]);
	});
});

describe("isWidgetAvailable", () => {
	it("requires all tokens and a non-false predicate", () => {
		const def = make({ requiredPermissions: ["a", "b"] });
		expect(isWidgetAvailable(def, ["a"])).toBe(false);
		expect(isWidgetAvailable(def, ["a", "b"])).toBe(true);
	});

	it("respects the isAvailable predicate directly", () => {
		expect(isWidgetAvailable(make({ isAvailable: () => true }))).toBe(true);
		expect(isWidgetAvailable(make({ isAvailable: () => false }))).toBe(false);
	});

	it("treats any non-false predicate result as available (!== false semantics)", () => {
		expect(
			isWidgetAvailable(
				make({ isAvailable: () => undefined as unknown as boolean }),
			),
		).toBe(true);
	});

	it("requires both permission tokens and a non-false predicate together", () => {
		const def = make({
			requiredPermissions: ["admin"],
			isAvailable: () => true,
		});
		expect(isWidgetAvailable(def, [])).toBe(false); // perms fail
		expect(isWidgetAvailable(def, ["admin"])).toBe(true); // both pass
	});
});
