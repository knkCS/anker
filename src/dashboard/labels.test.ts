import { describe, expect, it } from "vitest";
import { defaultDashboardLabels } from "./labels";

describe("defaultDashboardLabels", () => {
	it("provides English defaults for key labels", () => {
		expect(defaultDashboardLabels.edit).toBe("Edit");
		expect(defaultDashboardLabels.save).toBe("Save");
		expect(defaultDashboardLabels.addWidget).toBe("Add widget");
		expect(defaultDashboardLabels.unknownWidget).toBe("Unknown widget");
	});
});
