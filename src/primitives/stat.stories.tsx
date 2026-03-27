import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./layout";
import {
	StatDownTrend,
	StatHelpText,
	StatLabel,
	StatRoot,
	StatUpTrend,
	StatValueText,
} from "./stat";

const meta = {
	title: "Primitives/Stat",
	component: StatRoot,
} satisfies Meta<typeof StatRoot>;

export default meta;
type Story = StoryObj;

export const Default: Story = {
	render() {
		return (
			<StatRoot>
				<StatLabel>Total Revenue</StatLabel>
				<StatValueText
					value={45670}
					formatOptions={{ style: "currency", currency: "EUR" }}
				/>
			</StatRoot>
		);
	},
};

export const WithTrend: Story = {
	render() {
		return (
			<Stack direction="row" gap="8">
				<StatRoot>
					<StatLabel>Revenue</StatLabel>
					<StatValueText
						value={345670}
						formatOptions={{ style: "currency", currency: "EUR" }}
					/>
					<StatHelpText>
						<StatUpTrend>23.5%</StatUpTrend>
					</StatHelpText>
				</StatRoot>
				<StatRoot>
					<StatLabel>Costs</StatLabel>
					<StatValueText
						value={120000}
						formatOptions={{ style: "currency", currency: "EUR" }}
					/>
					<StatHelpText>
						<StatDownTrend>12.1%</StatDownTrend>
					</StatHelpText>
				</StatRoot>
			</Stack>
		);
	},
};

export const WithInfoTip: Story = {
	render() {
		return (
			<StatRoot>
				<StatLabel info="Revenue from all sources this month">
					Monthly Revenue
				</StatLabel>
				<StatValueText
					value={98500}
					formatOptions={{ style: "currency", currency: "EUR" }}
				/>
			</StatRoot>
		);
	},
};
