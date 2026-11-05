import type { Meta, StoryObj } from "@storybook/react";
import i18next from "i18next";
import { I18nextProvider } from "react-i18next";
import { DateCell } from "./date-cell";

const meta = {
	title: "Components/DataTable/Cells/DateCell",
	component: DateCell,
	args: {
		value: "2025-11-15T10:30:00Z",
	},
} satisfies Meta<typeof DateCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// A hub's UI language, set the way a hub sets it: through react-i18next. The
// cell reads it; nothing is passed to the cell.
const german = i18next.createInstance();
void german.init({ lng: "de", resources: {}, initImmediate: false });

export const InTheUiLanguage: Story = {
	args: {
		value: "2026-02-28",
	},
	decorators: [
		(Story) => (
			<I18nextProvider i18n={german}>
				<Story />
			</I18nextProvider>
		),
	],
};

export const WithLocale: Story = {
	args: {
		value: "2026-02-28",
		locale: "de",
	},
};

export const Relative: Story = {
	args: {
		value: "2026-03-20T14:45:00Z",
		showRelative: true,
	},
};

export const CustomFormat: Story = {
	args: {
		value: "2025-11-15T10:30:00Z",
		format: "DD/MM/YYYY HH:mm",
	},
};

export const NullValue: Story = {
	args: {
		value: null,
	},
};
