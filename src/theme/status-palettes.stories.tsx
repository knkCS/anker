import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../atoms/button";
import { Alert } from "../primitives/alert";
import { Badge } from "../primitives/badge";
import { DarkMode, LightMode } from "../primitives/color-mode";
import { Box, Grid, Stack } from "../primitives/layout";
import { Progress } from "../primitives/progress";
import { Heading, Text } from "../primitives/typography";
import { STATUS_PALETTES, type StatusPalette } from "./tokens/status-palettes";

/**
 * Every status palette × every relevant variant, in light and dark mode side
 * by side. `success` = done/healthy, `warning` = needs attention, `danger` =
 * failed/error (a status — destructive actions keep `colorPalette="red"`),
 * `info` = neutral notice / in progress.
 */
const meta = {
	title: "Theme/Status Palettes",
	parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const MEANING: Record<StatusPalette, string> = {
	success: "Done, healthy, passed",
	warning: "Needs attention, degraded, at risk",
	danger: "Failed, error, broken (status — not a destructive action)",
	info: "Notice, in progress, informational",
};

const VARIANTS = ["solid", "subtle", "outline"] as const;

function PaletteRow({ palette }: { palette: StatusPalette }) {
	return (
		<Stack gap="3">
			<Box>
				<Text fontWeight="semibold">colorPalette="{palette}"</Text>
				<Text fontSize="sm" color="muted">
					{MEANING[palette]}
				</Text>
			</Box>
			<Grid templateColumns="auto repeat(3, 1fr)" gap="3" alignItems="center">
				<Box />
				{VARIANTS.map((variant) => (
					<Text key={variant} fontSize="xs" color="subtle">
						{variant}
					</Text>
				))}
				<Text fontSize="xs" color="subtle">
					Badge
				</Text>
				{VARIANTS.map((variant) => (
					<Box key={variant}>
						<Badge colorPalette={palette} variant={variant}>
							{palette}
						</Badge>
					</Box>
				))}
				<Text fontSize="xs" color="subtle">
					Button
				</Text>
				{VARIANTS.map((variant) => (
					<Box key={variant}>
						<Button colorPalette={palette} variant={variant}>
							Retry
						</Button>
					</Box>
				))}
				<Text fontSize="xs" color="subtle">
					Alert
				</Text>
				{VARIANTS.map((variant) => (
					<Alert
						key={variant}
						colorPalette={palette}
						variant={variant}
						title={`Run ${palette}`}
					/>
				))}
				<Text fontSize="xs" color="subtle">
					Progress
				</Text>
				<Box />
				{(["subtle", "outline"] as const).map((variant) => (
					<Progress
						key={variant}
						colorPalette={palette}
						variant={variant}
						value={60}
					/>
				))}
			</Grid>
		</Stack>
	);
}

function Panel({ mode }: { mode: "light" | "dark" }) {
	const Wrap = mode === "dark" ? DarkMode : LightMode;
	return (
		<Wrap>
			<Box bg="bg-surface" color="default" p="6" flex="1" minW="0">
				<Stack gap="8">
					<Heading size="md">{mode === "dark" ? "Dark" : "Light"} mode</Heading>
					{STATUS_PALETTES.map((palette) => (
						<PaletteRow key={palette} palette={palette} />
					))}
				</Stack>
			</Box>
		</Wrap>
	);
}

export const AllPalettes: Story = {
	render: () => (
		<Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }}>
			<Panel mode="light" />
			<Panel mode="dark" />
		</Grid>
	),
};

export const Light: Story = { render: () => <Panel mode="light" /> };

export const Dark: Story = { render: () => <Panel mode="dark" /> };
