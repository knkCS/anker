import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import type {
	LookupPage,
	LookupResolveArgs,
	LookupSearchArgs,
} from "../atoms/select/lookup-select";
import type { BaseOption } from "../atoms/select/types";
import { LookupSelectField } from "./lookup-select-field";

/** Stands in for a server-owned collection; a real Source calls your service. */
const people: BaseOption[] = [
	{ id: "u1", label: "Ada Lovelace", avatar: "Ada Lovelace" },
	{ id: "u2", label: "Grace Hopper", avatar: "Grace Hopper" },
	{ id: "u3", label: "Alan Turing", avatar: "Alan Turing" },
	{ id: "u4", label: "Barbara Liskov", avatar: "Barbara Liskov" },
];

const slowly = <T,>(value: T, ms = 400) =>
	new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

async function searchPeople({
	query,
}: LookupSearchArgs): Promise<LookupPage<BaseOption>> {
	return slowly({
		items: people.filter((p) =>
			p.label.toLowerCase().includes(query.toLowerCase()),
		),
	});
}

async function resolvePeople({ ids }: LookupResolveArgs) {
	return slowly(people.filter((p) => ids.includes(p.id)));
}

const meta = {
	title: "Forms/LookupSelectField",
	component: LookupSelectField,
	parameters: {
		docs: {
			description: {
				component:
					"The select for a form whose options live on a server — a form-bound `LookupSelect`. The form value is the picked item's `id` (an array with `isMulti`); `resolve` turns stored ids back into labels.",
			},
		},
	},
	decorators: [
		(Story) => {
			const methods = useForm({
				defaultValues: { owner: "u2", watchers: ["u1", "u3"] },
			});
			return (
				<FormProvider {...methods}>
					<Story />
				</FormProvider>
			);
		},
	],
} satisfies Meta<typeof LookupSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		name: "owner",
		label: "Owner",
		helperText: "Who answers for this entry",
		search: searchPeople,
		resolve: resolvePeople,
	},
};

export const Multi: Story = {
	args: {
		name: "watchers",
		label: "Watchers",
		search: searchPeople,
		resolve: resolvePeople,
		isMulti: true,
	},
};
