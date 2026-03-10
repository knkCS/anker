import type { Meta, StoryObj } from "@storybook/react";
import { AccordionItem, AccordionRoot } from "./accordion";

const meta = {
	title: "Primitives/Accordion",
	component: AccordionItem,
} satisfies Meta<typeof AccordionItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: "item-1",
		label: "What is anker?",
		children:
			"Anker is the shared UI component library for the knk software group.",
	},
	render(args) {
		return (
			<AccordionRoot defaultValue={["item-1"]} collapsible>
				<AccordionItem {...args} />
				<AccordionItem
					value="item-2"
					label="How do I install it?"
					children="Run npm install @knkcs/anker"
				/>
				<AccordionItem
					value="item-3"
					label="What framework does it use?"
					children="Chakra UI v3 with React 19 and TypeScript."
				/>
			</AccordionRoot>
		);
	},
};

export const Multiple: Story = {
	render() {
		return (
			<AccordionRoot multiple>
				<AccordionItem value="a" label="Section A">
					Content for section A.
				</AccordionItem>
				<AccordionItem value="b" label="Section B">
					Content for section B.
				</AccordionItem>
				<AccordionItem value="c" label="Section C">
					Content for section C.
				</AccordionItem>
			</AccordionRoot>
		);
	},
};
