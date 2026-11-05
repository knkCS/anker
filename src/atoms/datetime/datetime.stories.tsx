import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { RelativeDateTime } from "./relative-datetime";
import type { DateFormat } from "./types";
import { formatDate, formatDateAndTime } from "./utils/format-date-time-utils";

const meta = {
	title: "Atoms/DateTime",
	component: RelativeDateTime,
} satisfies Meta<typeof RelativeDateTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		date: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
	},
};

export const Variants: Story = {
	args: {
		date: new Date(),
	},
	render() {
		const now = new Date();
		return (
			<Stack gap={2}>
				<Text>
					5 min ago:{" "}
					<RelativeDateTime date={new Date(now.getTime() - 5 * 60000)} />
				</Text>
				<Text>
					1 hour ago:{" "}
					<RelativeDateTime date={new Date(now.getTime() - 3600000)} />
				</Text>
				<Text>
					Yesterday:{" "}
					<RelativeDateTime
						date={new Date(now.getTime() - 86400000)}
						isRelativeToCurrentWeek
					/>
				</Text>
			</Stack>
		);
	},
};

// `formatDateAndTime` writes each format in the UI language a hub sets
// through react-i18next, or in the `locale` it is given (English without
// either). English keeps its templates for every format but `day`, which is the
// language's medium date everywhere.
export const FormattedInALanguage: Story = {
	args: {
		date: new Date(2026, 1, 28, 15, 45, 7),
	},
	render({ date }) {
		const formats: DateFormat[] = [
			"day",
			"weekday",
			"time",
			"full",
			"fullWithSeconds",
		];
		return (
			<Stack gap={2}>
				{formats.map((format) => (
					<Text key={format}>
						{format}: {formatDateAndTime(date, format, "en")} ·{" "}
						{formatDateAndTime(date, format, "de")}
					</Text>
				))}
				<Text>
					date-only "2026-02-28": {formatDate("2026-02-28", "en")} ·{" "}
					{formatDate("2026-02-28", "de")}
				</Text>
			</Stack>
		);
	},
};
