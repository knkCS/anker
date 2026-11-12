import type { Meta, StoryObj } from "@storybook/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { IconButton } from "../atoms/button";
import { Box, Flex, Stack } from "../primitives/layout";
import { Text } from "../primitives/typography";
import { IconSearch, type IconSearchProps } from "./icon-search";

const meta = {
	title: "Forms/IconSearch",
	component: IconSearch,
	args: {
		label: "Search the tree",
		onSearch: (query: string) => console.log("Search:", query),
	},
} satisfies Meta<typeof IconSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At a label row's end it opens leftwards, over the row's free space. */
export const InALabelRow: Story = {
	args: { shortcut: "/" },
	render(args) {
		return (
			<Flex width="420px" alignItems="center" gap="2">
				<Text fontWeight="medium">Parent page</Text>
				<IconSearch {...args} />
			</Flex>
		);
	},
};

const NODES = [
	"Home",
	"About us",
	"About our team",
	"Careers",
	"Contact",
	"Press",
	"Press releases",
];

function WithCounterDemo(args: IconSearchProps) {
	const [query, setQuery] = useState("");
	const [current, setCurrent] = useState(0);
	const matches = useMemo(
		() =>
			query
				? NODES.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
				: [],
		[query],
	);
	const step = (by: number) =>
		setCurrent((c) =>
			matches.length ? (c + by + matches.length) % matches.length : 0,
		);
	return (
		<Stack width="420px" gap="2">
			<Flex alignItems="center" gap="2">
				<Text fontWeight="medium">Parent page</Text>
				<IconSearch
					{...args}
					onSearch={(q) => {
						setQuery(q);
						setCurrent(0);
					}}
					counter={
						query ? (
							<>
								<Text fontSize="xs" color="muted" whiteSpace="nowrap">
									{matches.length
										? `${current + 1} of ${matches.length}`
										: "No matches"}
								</Text>
								<IconButton
									aria-label="Previous match"
									colorPalette="gray"
									size="2xs"
									disabled={!matches.length}
									onClick={() => step(-1)}
								>
									<ChevronUp size={14} />
								</IconButton>
								<IconButton
									aria-label="Next match"
									colorPalette="gray"
									size="2xs"
									disabled={!matches.length}
									onClick={() => step(1)}
								>
									<ChevronDown size={14} />
								</IconButton>
							</>
						) : null
					}
				/>
			</Flex>
			<Box>
				{NODES.map((n) => (
					<Text
						key={n}
						fontWeight={matches[current] === n ? "semibold" : "normal"}
					>
						{n}
					</Text>
				))}
			</Box>
		</Stack>
	);
}

/** The counter slot carries a match count and previous/next. */
export const WithCounter: Story = {
	render: (args) => <WithCounterDemo {...args} />,
};

function ControlledDemo(args: IconSearchProps) {
	const [value, setValue] = useState("");
	return (
		<Stack width="420px" gap="2">
			<Flex alignItems="center" gap="2">
				<Text fontWeight="medium">Parent page</Text>
				<IconSearch {...args} value={value} onValueChange={setValue} />
			</Flex>
			<Text fontSize="sm" color="muted">
				Value: “{value}”
			</Text>
		</Stack>
	);
}

/** Controlled: the query lives in the parent. */
export const Controlled: Story = {
	render: (args) => <ControlledDemo {...args} />,
};

export const Disabled: Story = {
	args: { disabled: true },
};
