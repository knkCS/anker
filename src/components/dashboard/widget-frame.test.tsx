import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { defaultDashboardLabels } from "./labels";
import type { WidgetDefinition, WidgetInstance } from "./types";
import { WidgetFrame } from "./widget-frame";

const def: WidgetDefinition = {
	type: "stat",
	name: "Stat",
	icon: null,
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	settingsSchema: [{ key: "v", label: "V", type: "number", defaultValue: 1 }],
	defaultSettings: { v: 1 },
	Component: ({ settings }) => <span>val:{String(settings.v)}</span>,
};
const instance: WidgetInstance = {
	id: "1",
	type: "stat",
	settings: { v: 7 },
	layout: { x: 0, y: 0, w: 2, h: 2 },
};

const renderFrame = (
	props: Partial<React.ComponentProps<typeof WidgetFrame>> = {},
) =>
	render(
		<ChakraProvider value={defaultSystem}>
			<WidgetFrame
				definition={def}
				instance={instance}
				mode="view"
				labels={defaultDashboardLabels}
				{...props}
			/>
		</ChakraProvider>,
	);

describe("WidgetFrame", () => {
	it("renders the name and resolved body in view mode", () => {
		renderFrame();
		expect(screen.getByText("Stat")).toBeInTheDocument();
		expect(screen.getByText("val:7")).toBeInTheDocument();
	});

	it("shows configure and remove controls in edit mode", () => {
		renderFrame({ mode: "edit" });
		expect(
			screen.getByLabelText(defaultDashboardLabels.configureWidget),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText(defaultDashboardLabels.removeWidget),
		).toBeInTheDocument();
	});

	it("renders an unknown-widget placeholder when no definition matches", () => {
		render(
			<ChakraProvider value={defaultSystem}>
				<WidgetFrame
					instance={{ ...instance, type: "ghost" }}
					mode="view"
					labels={defaultDashboardLabels}
				/>
			</ChakraProvider>,
		);
		expect(
			screen.getByText(defaultDashboardLabels.unknownWidget),
		).toBeInTheDocument();
	});

	it("hides the configure button when the widget is not configurable", () => {
		const nonConfigurable = {
			...def,
			settingsSchema: [],
			ConfigEditor: undefined,
		};
		renderFrame({ mode: "edit", definition: nonConfigurable });
		expect(
			screen.queryByLabelText(defaultDashboardLabels.configureWidget),
		).toBeNull();
		expect(
			screen.getByLabelText(defaultDashboardLabels.removeWidget),
		).toBeInTheDocument();
	});

	it("renders a no-access placeholder and hides the body when unavailable", () => {
		renderFrame({ available: false });
		expect(
			screen.getByText(defaultDashboardLabels.noAccessWidget),
		).toBeInTheDocument();
		expect(screen.queryByText("val:7")).toBeNull();
	});
});
