// src/templates/loading-page.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "../primitives/typography";
import { LoadingPage } from "./loading-page";

const meta = {
	title: "Templates/LoadingPage",
	component: LoadingPage,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LoadingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const Logo = () => (
	<Heading as="span" size="lg" color="primary.700" fontWeight="bold">
		knk
	</Heading>
);

export const Default: Story = {
	args: {
		logo: <Logo />,
		message: "Loading your workspace…",
	},
};

export const Bare: Story = {
	args: {},
};
