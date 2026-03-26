import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { InlineCreatableList } from "./inline-creatable-list";

const meta = {
	title: "Components/InlineCreatableList",
	component: InlineCreatableList,
} satisfies Meta<typeof InlineCreatableList>;

export default meta;
type Story = StoryObj<typeof meta>;

interface Item {
	id: string;
	name: string;
	color?: string;
}

const initialTags: Item[] = [
	{ id: "1", name: "Design" },
	{ id: "2", name: "Marketing" },
	{ id: "3", name: "Engineering" },
	{ id: "4", name: "Sales" },
];

const initialCollections: Item[] = [
	{ id: "c1", name: "Favorites" },
	{ id: "c2", name: "Recent" },
	{ id: "c3", name: "Shared" },
];

const coloredItems: Item[] = [
	{ id: "col1", name: "Urgent", color: "#ef4444" },
	{ id: "col2", name: "In Progress", color: "#f59e0b" },
	{ id: "col3", name: "Done", color: "#10b981" },
	{ id: "col4", name: "Review", color: "#8b5cf6" },
];

let nextId = 100;

const WrapVariantDemo = () => {
	const [items, setItems] = useState<Item[]>(initialTags);
	const [activeIds, setActiveIds] = useState<Set<string>>(new Set(["1", "3"]));

	const handleToggle = (id: string) => {
		setActiveIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleCreate = async (name: string) => {
		await new Promise((r) => setTimeout(r, 300));
		const newItem: Item = { id: String(nextId++), name };
		setItems((prev) => [...prev, newItem]);
		setActiveIds((prev) => new Set([...prev, newItem.id]));
	};

	return (
		<InlineCreatableList<Item>
			items={items}
			activeIds={[...activeIds]}
			onToggle={handleToggle}
			onCreate={handleCreate}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
		/>
	);
};

export const WrapVariant: Story = {
	render: () => <WrapVariantDemo />,
};

const ListVariantDemo = () => {
	const [items, setItems] = useState<Item[]>(initialCollections);
	const [activeId, setActiveId] = useState<string | null>("c1");

	const handleToggle = (id: string) => {
		setActiveId((prev) => (prev === id ? null : id));
	};

	const handleCreate = async (name: string) => {
		await new Promise((r) => setTimeout(r, 300));
		const newItem: Item = { id: String(nextId++), name };
		setItems((prev) => [...prev, newItem]);
		setActiveId(newItem.id);
	};

	return (
		<InlineCreatableList<Item>
			items={items}
			activeIds={activeId ? [activeId] : []}
			variant="list"
			onToggle={handleToggle}
			onCreate={handleCreate}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			createLabel="New collection"
			createPlaceholder="Collection name..."
		/>
	);
};

export const ListVariant: Story = {
	render: () => <ListVariantDemo />,
};

const WithColorsDemo = () => {
	const [items] = useState<Item[]>(coloredItems);
	const [activeIds, setActiveIds] = useState<Set<string>>(
		new Set(["col1", "col3"]),
	);

	const handleToggle = (id: string) => {
		setActiveIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	return (
		<InlineCreatableList<Item>
			items={items}
			activeIds={[...activeIds]}
			onToggle={handleToggle}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			getItemColor={(t) => t.color}
		/>
	);
};

export const WithColors: Story = {
	render: () => <WithColorsDemo />,
};

const EmptyDemo = () => {
	const [items, setItems] = useState<Item[]>([]);
	const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

	const handleCreate = async (name: string) => {
		await new Promise((r) => setTimeout(r, 300));
		const newItem: Item = { id: String(nextId++), name };
		setItems((prev) => [...prev, newItem]);
		setActiveIds((prev) => new Set([...prev, newItem.id]));
	};

	return (
		<InlineCreatableList<Item>
			items={items}
			activeIds={[...activeIds]}
			onToggle={(id) =>
				setActiveIds((prev) => {
					const next = new Set(prev);
					if (next.has(id)) next.delete(id);
					else next.add(id);
					return next;
				})
			}
			onCreate={handleCreate}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
		/>
	);
};

export const Empty: Story = {
	render: () => <EmptyDemo />,
};

const CreateModeDemo = () => {
	const [items, setItems] = useState<Item[]>(initialTags);
	const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

	const handleCreate = async (name: string) => {
		await new Promise((r) => setTimeout(r, 500));
		const newItem: Item = { id: String(nextId++), name };
		setItems((prev) => [...prev, newItem]);
		setActiveIds((prev) => new Set([...prev, newItem.id]));
	};

	return (
		<InlineCreatableList<Item>
			items={items}
			activeIds={[...activeIds]}
			onToggle={(id) =>
				setActiveIds((prev) => {
					const next = new Set(prev);
					if (next.has(id)) next.delete(id);
					else next.add(id);
					return next;
				})
			}
			onCreate={handleCreate}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			createLabel="New tag"
			createPlaceholder="Tag name..."
		/>
	);
};

export const CreateMode: Story = {
	render: () => <CreateModeDemo />,
};

export const Disabled: Story = {
	render: () => (
		<InlineCreatableList<Item>
			items={initialTags}
			activeIds={["1", "3"]}
			onToggle={() => {}}
			onCreate={async () => {}}
			getItemId={(t) => t.id}
			getItemLabel={(t) => t.name}
			disabled={true}
		/>
	),
};
