import type { Meta, StoryObj } from "@storybook/react";
import type React from "react";
import { useState } from "react";
import { HStack, Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { DynamicIcon } from "./dynamic-icon";
import { IconPicker } from "./icon-picker";

const meta = {
	title: "Atoms/IconPicker",
	component: IconPicker,
	parameters: {
		docs: {
			description: {
				component:
					"Chooses a lucide icon and stores its name (`\"file-text\"`). Searches every lucide icon by name and by lucide's tags, filters by lucide's categories, and remembers recent picks in the browser. In a form: `IconPickerField`. To render a stored name: `DynamicIcon`.",
			},
		},
	},
	args: { value: null, onChange: () => {} },
} satisfies Meta<typeof IconPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled({
	initial = null,
	...props
}: Partial<React.ComponentProps<typeof IconPicker>> & {
	initial?: string | null;
}) {
	const [value, setValue] = useState<string | null>(initial);
	return (
		<Stack gap="3" align="start">
			<IconPicker {...props} value={value} onChange={setValue} />
			<Text textStyle="caption">Stored value: {JSON.stringify(value)}</Text>
		</Stack>
	);
}

export const Default: Story = {
	render: () => <Controlled />,
};

export const WithValue: Story = {
	render: () => <Controlled initial="file-text" />,
};

export const NotClearable: Story = {
	render: () => <Controlled initial="banknote" isClearable={false} />,
};

export const Disabled: Story = {
	render: () => <Controlled initial="banknote" disabled />,
};

export const ReadOnly: Story = {
	render: () => <Controlled initial="banknote" readOnly />,
};

export const NoRecentHistory: Story = {
	render: () => <Controlled recentStorageKey={null} />,
};

export const Localised: Story = {
	render: () => (
		<Controlled
			labels={{
				placeholder: "Symbol wählen",
				search: "Symbole suchen",
				clear: "Symbol entfernen",
				grid: "Symbole",
				categories: "Kategorien",
				allCategories: "Alle",
				recent: "Zuletzt verwendet",
				allIcons: "Alle Symbole",
				noResults: "Keine Symbole gefunden",
			}}
		/>
	),
};

/** `DynamicIcon` renders a stored name — in a list, a rail, a table cell. */
export const DynamicIconInAList: Story = {
	render: () => (
		<Stack gap="2">
			{["file-text", "banknote", "alert-triangle", "not-a-real-icon"].map(
				(name) => (
					<HStack key={name} gap="2">
						<DynamicIcon name={name} size={16} />
						<Text fontSize="sm">{name}</Text>
					</HStack>
				),
			)}
		</Stack>
	),
};
