import { describe, expect, it } from "vitest";
import { resolveWidgetSettings } from "./resolve-settings";
import type { WidgetDefinition, WidgetInstance } from "./types";

const def = {
	type: "t",
	name: "T",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 1, h: 1 },
	defaultSettings: { limit: 5, show: true },
	Component: () => null,
} as WidgetDefinition;

const instance: WidgetInstance = {
	id: "1",
	type: "t",
	settings: { limit: 9 },
	layout: { x: 0, y: 0, w: 1, h: 1 },
};

describe("resolveWidgetSettings", () => {
	it("merges instance settings over definition defaults", () => {
		expect(resolveWidgetSettings(def, instance)).toEqual({
			limit: 9,
			show: true,
		});
	});
	it("returns instance settings when definition is undefined", () => {
		expect(resolveWidgetSettings(undefined, instance)).toEqual({ limit: 9 });
	});
});
