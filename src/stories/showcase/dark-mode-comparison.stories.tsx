import {
	Box,
	Flex,
	Grid,
	Heading,
	HStack,
	Separator,
	Stack,
	Text,
} from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Moon, Sun, Users } from "lucide-react";
import { Button } from "../../atoms/button/button";
import { DataList } from "../../atoms/data-list/data-list";
import { Persona } from "../../atoms/persona/persona";
import { SearchInput } from "../../atoms/search-input/search-input";
import { StatusBadge } from "../../atoms/status-badge/status-badge";
import { Card } from "../../components/card";
import { Widget } from "../../components/widget";
import { DarkMode, LightMode } from "../../primitives/color-mode";
import { Progress } from "../../primitives/progress";

const meta = {
	title: "Showcase/Dark Mode Comparison",
	parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const dataListItems = [
	{ label: "Email", value: "sarah.mitchell@knkcs.com" },
	{ label: "Role", value: "Product Manager" },
	{ label: "Department", value: "Engineering" },
];

function SampleUI() {
	return (
		<Stack gap={4} p={4} bg="bg-canvas" minH="100%">
			<Heading size="md" color="fg">
				Dashboard
			</Heading>

			<Widget
				heading="Total Users"
				subHeading="Active accounts"
				icon={<Users size={20} />}
			>
				<HStack align="baseline" gap={2}>
					<Text fontSize="3xl" fontWeight="bold" color="fg">
						1,284
					</Text>
					<StatusBadge label="+12%" color="#38A169" />
				</HStack>
			</Widget>

			<Card>
				<HStack justify="space-between" align="center">
					<Persona size="sm" name="Sarah Mitchell" />
					<StatusBadge label="Active" color="#38A169" />
				</HStack>
			</Card>

			<Card title="User Details">
				<DataList items={dataListItems} />
			</Card>

			<HStack gap={2} flexWrap="wrap">
				<Button variant="solid" size="sm">
					Save
				</Button>
				<Button variant="outline" size="sm">
					Cancel
				</Button>
				<Button variant="ghost" size="sm">
					Reset
				</Button>
			</HStack>

			<SearchInput onSearch={() => {}} placeholder="Search..." />

			<Box>
				<Flex justify="space-between" mb={1}>
					<Text fontSize="sm" color="fg.muted">
						Completion
					</Text>
					<Text fontSize="sm" fontWeight="medium" color="fg">
						65%
					</Text>
				</Flex>
				<Progress value={65} colorPalette="blue" />
			</Box>
		</Stack>
	);
}

function DarkModeComparisonDemo() {
	return (
		<Box maxW="1200px" mx="auto">
			<Stack gap={6}>
				<Box>
					<Heading size="lg" mb={1}>
						Dark Mode Comparison
					</Heading>
					<Text color="fg.muted" fontSize="sm">
						The same UI rendered side-by-side in light and dark mode to validate
						semantic token behaviour.
					</Text>
				</Box>

				<Separator />

				<Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
					{/* Light Mode column */}
					<Stack gap={0} borderRadius="xl" overflow="hidden" shadow="md">
						<HStack
							px={4}
							py={3}
							bg="gray.100"
							gap={2}
							borderBottomWidth="1px"
							borderColor="gray.200"
						>
							<Sun size={16} color="#D97706" />
							<Text fontWeight="semibold" fontSize="sm" color="gray.700">
								Light Mode
							</Text>
						</HStack>
						<LightMode>
							<Box bg="white">
								<SampleUI />
							</Box>
						</LightMode>
					</Stack>

					{/* Dark Mode column */}
					<Stack gap={0} borderRadius="xl" overflow="hidden" shadow="md">
						<HStack
							px={4}
							py={3}
							bg="gray.800"
							gap={2}
							borderBottomWidth="1px"
							borderColor="gray.700"
						>
							<Moon size={16} color="#93C5FD" />
							<Text fontWeight="semibold" fontSize="sm" color="gray.200">
								Dark Mode
							</Text>
						</HStack>
						<DarkMode>
							<Box bg="gray.900">
								<SampleUI />
							</Box>
						</DarkMode>
					</Stack>
				</Grid>
			</Stack>
		</Box>
	);
}

export const Default: Story = {
	render: () => <DarkModeComparisonDemo />,
};
