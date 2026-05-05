// src/templates/error-page.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../atoms/button";
import { Heading } from "../primitives/typography";
import { ErrorPage } from "./error-page";

const meta = {
	title: "Templates/ErrorPage",
	component: ErrorPage,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const Logo = () => (
	<Heading as="span" size="md" color="primary.700" fontWeight="bold">
		knk
	</Heading>
);

export const NotFound: Story = {
	args: {
		logo: <Logo />,
		statusCode: "404",
		title: "Page not found",
		description:
			"The page you were looking for has moved, expired, or never existed.",
		actions: (
			<>
				<Button colorPalette="primary" size="md">
					Back to dashboard
				</Button>
				<Button variant="ghost" size="md">
					Contact support
				</Button>
			</>
		),
	},
};

export const ServerError: Story = {
	args: {
		logo: <Logo />,
		statusCode: "500",
		title: "Something went wrong",
		description:
			"An unexpected error occurred on the server. We've been notified and are looking into it.",
		actions: (
			<Button colorPalette="primary" size="md">
				Retry
			</Button>
		),
	},
};

export const Forbidden: Story = {
	args: {
		statusCode: "403",
		title: "Access denied",
		description:
			"You don't have permission to view this resource. Contact your workspace admin if you think this is wrong.",
		actions: (
			<Button colorPalette="primary" size="md">
				Back home
			</Button>
		),
	},
};
