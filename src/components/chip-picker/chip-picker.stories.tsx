import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChipPicker } from "./chip-picker";

const meta = {
	title: "Components/ChipPicker",
	component: ChipPicker,
} satisfies Meta<typeof ChipPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

interface Tag {
	id: string;
	name: string;
	color?: string;
}

const allTags: Tag[] = [
	{ id: "1", name: "Design", color: "#3b82f6" },
	{ id: "2", name: "Marketing", color: "#10b981" },
	{ id: "3", name: "Engineering", color: "#8b5cf6" },
	{ id: "4", name: "Sales", color: "#f59e0b" },
	{ id: "5", name: "Support", color: "#ef4444" },
];

const DefaultDemo = () => {
	const [assigned, setAssigned] = useState<Tag[]>([allTags[0], allTags[2]]);

	return (
		<ChipPicker<Tag>
			assigned={assigned}
			available={allTags}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			onAdd={(t) => setAssigned((prev) => [...prev, t])}
			onRemove={(t) => setAssigned((prev) => prev.filter((p) => p.id !== t.id))}
		/>
	);
};

export const Default: Story = {
	render: () => <DefaultDemo />,
};

const EmptyDemo = () => {
	const [assigned, setAssigned] = useState<Tag[]>([]);

	return (
		<ChipPicker<Tag>
			assigned={assigned}
			available={allTags}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			onAdd={(t) => setAssigned((prev) => [...prev, t])}
			onRemove={(t) => setAssigned((prev) => prev.filter((p) => p.id !== t.id))}
		/>
	);
};

export const Empty: Story = {
	render: () => <EmptyDemo />,
};

const SearchableDemo = () => {
	const [assigned, setAssigned] = useState<Tag[]>([allTags[1]]);

	return (
		<ChipPicker<Tag>
			assigned={assigned}
			available={allTags}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			searchable={true}
			onAdd={(t) => setAssigned((prev) => [...prev, t])}
			onRemove={(t) => setAssigned((prev) => prev.filter((p) => p.id !== t.id))}
		/>
	);
};

export const Searchable: Story = {
	render: () => <SearchableDemo />,
};

const WithColorsDemo = () => {
	const [assigned, setAssigned] = useState<Tag[]>([allTags[0], allTags[3]]);

	return (
		<ChipPicker<Tag>
			assigned={assigned}
			available={allTags}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			getItemColor={(t) => t.color}
			onAdd={(t) => setAssigned((prev) => [...prev, t])}
			onRemove={(t) => setAssigned((prev) => prev.filter((p) => p.id !== t.id))}
		/>
	);
};

export const WithColors: Story = {
	render: () => <WithColorsDemo />,
};

export const Disabled: Story = {
	render: () => (
		<ChipPicker<Tag>
			assigned={[allTags[0], allTags[2]]}
			available={allTags}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			getItemColor={(t) => t.color}
			onAdd={() => {}}
			onRemove={() => {}}
			disabled={true}
		/>
	),
};

export const AllAssigned: Story = {
	render: () => (
		<ChipPicker<Tag>
			assigned={allTags}
			available={allTags}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			getItemColor={(t) => t.color}
			onAdd={() => {}}
			onRemove={() => {}}
		/>
	),
};
