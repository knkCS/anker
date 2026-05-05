// src/templates/maintenance-page.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Heading, Link } from "../primitives/typography";
import { MaintenancePage } from "./maintenance-page";

const meta = {
	title: "Templates/MaintenancePage",
	component: MaintenancePage,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MaintenancePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const Logo = () => (
	<Heading as="span" size="md" color="primary.700" fontWeight="bold">
		knk
	</Heading>
);

export const Default: Story = {
	args: {
		logo: <Logo />,
		eta: "Estimated back online: 14:30 UTC",
		statusLink: <Link href="#">View status page →</Link>,
	},
};

export const Minimal: Story = {
	args: {},
};
