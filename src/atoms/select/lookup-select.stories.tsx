import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Box } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import {
	type LookupPage,
	type LookupSearchArgs,
	LookupSelect,
} from "./lookup-select";
import type { BaseOption } from "./types";

const meta = {
	title: "Atoms/LookupSelect",
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * Stands in for a server-owned collection. A real Source is a call to your
 * service — LookupSelect cannot tell the difference and does not try to.
 */
const people: BaseOption[] = [
	{ id: "u1", label: "Ada Lovelace", avatar: "Ada Lovelace" },
	{ id: "u2", label: "Grace Hopper", avatar: "Grace Hopper" },
	{ id: "u3", label: "Alan Turing", avatar: "Alan Turing" },
	{ id: "u4", label: "Barbara Liskov", avatar: "Barbara Liskov" },
	{ id: "u5", label: "Edsger Dijkstra", avatar: "Edsger Dijkstra" },
	{ id: "u6", label: "Katherine Johnson", avatar: "Katherine Johnson" },
	{ id: "u7", label: "Margaret Hamilton", avatar: "Margaret Hamilton" },
	{ id: "u8", label: "Donald Knuth", avatar: "Donald Knuth" },
];

const PAGE_SIZE = 3;

const slowly = <T,>(value: T, ms = 400) =>
	new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

async function searchPeople({
	query,
	cursor,
}: LookupSearchArgs): Promise<LookupPage<BaseOption>> {
	const matches = people.filter((person) =>
		person.label.toLowerCase().includes(query.toLowerCase()),
	);
	const start = cursor ? Number(cursor) : 0;
	const page = matches.slice(start, start + PAGE_SIZE);
	const next = start + PAGE_SIZE;
	return slowly({
		items: page,
		nextCursor: next < matches.length ? String(next) : null,
	});
}

async function resolvePeople({ ids }: { ids: string[] }) {
	return slowly(people.filter((person) => ids.includes(person.id)));
}

function SingleDemo() {
	// The consumer stores the id, as a form value would.
	const [id, setId] = useState<string | null>(null);
	return (
		<Box maxW="400px">
			<LookupSelect
				value={id}
				search={searchPeople}
				resolve={resolvePeople}
				onChange={(next) => setId((next as BaseOption | null)?.id ?? null)}
				placeholder="Search people…"
			/>
			<Text mt={3} textStyle="caption">
				Stored value: {id ?? "—"}
			</Text>
		</Box>
	);
}

export const Default: Story = {
	render: () => <SingleDemo />,
};

function MultiDemo() {
	const [ids, setIds] = useState<string[]>([]);
	return (
		<Box maxW="400px">
			<LookupSelect
				isMulti
				value={ids}
				search={searchPeople}
				resolve={resolvePeople}
				onChange={(next) => setIds((next as BaseOption[]).map((it) => it.id))}
				placeholder="Search people…"
			/>
			<Text mt={3} textStyle="caption">
				Stored value: {ids.length > 0 ? ids.join(", ") : "—"}
			</Text>
		</Box>
	);
}

export const Multi: Story = {
	render: () => <MultiDemo />,
};

function StoredValueDemo() {
	const [id, setId] = useState<string | null>("u6");
	return (
		<Box maxW="400px">
			<LookupSelect
				value={id}
				search={searchPeople}
				resolve={resolvePeople}
				onChange={(next) => setId((next as BaseOption | null)?.id ?? null)}
			/>
			<Text mt={3} textStyle="caption">
				Mounted holding <code>u6</code> and nothing else; the resolver supplied
				the name.
			</Text>
		</Box>
	);
}

/** A stored id, resolved into a readable label on mount. */
export const StoredValue: Story = {
	render: () => <StoredValueDemo />,
};

function NoResolverDemo() {
	const [id, setId] = useState<string | null>("u6");
	return (
		<Box maxW="400px">
			<LookupSelect
				value={id}
				search={searchPeople}
				onChange={(next) => setId((next as BaseOption | null)?.id ?? null)}
			/>
			<Text mt={3} textStyle="caption">
				No resolver: the id shows as itself until someone picks a replacement.
			</Text>
		</Box>
	);
}

/** The same stored id with no resolver — degraded visibly, not broken. */
export const WithoutResolver: Story = {
	render: () => <NoResolverDemo />,
};

function FailingDemo() {
	const [id, setId] = useState<string | null>(null);
	return (
		<Box maxW="400px">
			<LookupSelect
				value={id}
				search={async () => {
					await slowly(null);
					throw new Error("the Source is unreachable");
				}}
				onChange={(next) => setId((next as BaseOption | null)?.id ?? null)}
				placeholder="Search people…"
			/>
			<Text mt={3} textStyle="caption">
				The Source always fails; the control stays usable.
			</Text>
		</Box>
	);
}

/** A Source failure, surfaced in the menu. */
export const SourceFailure: Story = {
	render: () => <FailingDemo />,
};
