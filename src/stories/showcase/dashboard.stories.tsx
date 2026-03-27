import {
	Box,
	Flex,
	Grid,
	GridItem,
	Heading,
	HStack,
	Stack,
	Text,
} from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import {
	Activity,
	AlertTriangle,
	BarChart3,
	CheckCircle,
	Clock,
	FileText,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../atoms/button/button";
import { StatusBadge } from "../../atoms/status-badge/status-badge";
import { Card } from "../../components/card";
import {
	Stepper,
	StepperCompleted,
	StepperStep,
} from "../../components/stepper/stepper";
import {
	useStepperNextButton,
	useStepperPrevButton,
} from "../../components/stepper/use-stepper";
import { Widget } from "../../components/widget";
import { Progress } from "../../primitives/progress";

const meta = {
	title: "Showcase/Dashboard",
	parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stepper controls — must be rendered inside a Stepper (has StepperProvider)
// ---------------------------------------------------------------------------

const StepperControls = () => {
	const prevProps = useStepperPrevButton({ label: "Back" });
	const nextProps = useStepperNextButton({
		label: "Next",
		submitLabel: "Finish",
	});

	return (
		<HStack marginBlockStart={6} justify="flex-end">
			<Button variant="outline" {...prevProps} />
			<Button variant="primary" {...nextProps} />
		</HStack>
	);
};

// ---------------------------------------------------------------------------
// Project progress data
// ---------------------------------------------------------------------------

const projects = [
	{
		name: "CMS Core Migration",
		progress: 82,
		status: "In Progress",
		color: "#2087d7",
	},
	{
		name: "Design System Rollout",
		progress: 100,
		status: "Complete",
		color: "#22c55e",
	},
	{
		name: "API Gateway Upgrade",
		progress: 47,
		status: "In Progress",
		color: "#2087d7",
	},
	{ name: "Security Audit", progress: 15, status: "Blocked", color: "#e9580c" },
];

// ---------------------------------------------------------------------------
// Recent activity data
// ---------------------------------------------------------------------------

const activities = [
	{
		icon: <CheckCircle size={16} />,
		description: "Design System Rollout marked as complete",
		timeAgo: "2 min ago",
		iconColor: "#22c55e",
	},
	{
		icon: <Users size={16} />,
		description: "3 new users joined the team",
		timeAgo: "14 min ago",
		iconColor: "#2087d7",
	},
	{
		icon: <AlertTriangle size={16} />,
		description: "Security Audit task flagged as blocked",
		timeAgo: "1 hr ago",
		iconColor: "#e9580c",
	},
	{
		icon: <FileText size={16} />,
		description: "API Gateway Upgrade spec updated",
		timeAgo: "3 hr ago",
		iconColor: "#6b7280",
	},
	{
		icon: <BarChart3 size={16} />,
		description: "Monthly performance report generated",
		timeAgo: "Yesterday",
		iconColor: "#6b7280",
	},
];

// ---------------------------------------------------------------------------
// Main dashboard component
// ---------------------------------------------------------------------------

const DashboardDemo = () => {
	const [_step, _setStep] = useState(0);

	return (
		<Box maxW="1200px" marginInline="auto">
			{/* Header */}
			<Stack gap={1} marginBlockEnd={8}>
				<Heading size="2xl" fontWeight="bold">
					Dashboard
				</Heading>
				<Text color="fg.muted">Welcome back, Sarah</Text>
				<Text fontSize="sm" color="fg.subtle">
					Thursday, 27 March 2026
				</Text>
			</Stack>

			{/* Row 1 — Metric widgets */}
			<Grid
				templateColumns={{
					base: "1fr",
					sm: "repeat(2, 1fr)",
					lg: "repeat(4, 1fr)",
				}}
				gap={4}
				marginBlockEnd={6}
			>
				{/* Total Users */}
				<GridItem>
					<Widget
						heading="Total Users"
						subHeading="Active accounts"
						icon={<Users size={20} />}
					>
						<Stack gap={1}>
							<Text fontSize="3xl" fontWeight="bold" lineHeight="1">
								2,847
							</Text>
							<HStack gap={1}>
								<TrendingUp size={14} color="#22c55e" />
								<Text fontSize="xs" color="#22c55e" fontWeight="medium">
									+12.5% from last month
								</Text>
							</HStack>
						</Stack>
					</Widget>
				</GridItem>

				{/* Open Tasks */}
				<GridItem>
					<Widget
						heading="Open Tasks"
						subHeading="Pending items"
						icon={<FileText size={20} />}
					>
						<Stack gap={1}>
							<Text fontSize="3xl" fontWeight="bold" lineHeight="1">
								156
							</Text>
							<HStack gap={1}>
								<AlertTriangle size={14} color="#e9580c" />
								<Text fontSize="xs" color="#e9580c" fontWeight="medium">
									23 due today
								</Text>
							</HStack>
						</Stack>
					</Widget>
				</GridItem>

				{/* Completed */}
				<GridItem>
					<Widget
						heading="Completed"
						subHeading="This quarter"
						icon={<CheckCircle size={20} />}
					>
						<Stack gap={2}>
							<Text fontSize="3xl" fontWeight="bold" lineHeight="1">
								1,203
							</Text>
							<Progress
								value={78}
								size="sm"
								label="78% of goal"
								showValue={false}
							/>
						</Stack>
					</Widget>
				</GridItem>

				{/* Response Time */}
				<GridItem>
					<Widget
						heading="Response Time"
						subHeading="Average p95 latency"
						icon={<Clock size={20} />}
					>
						<Stack gap={1}>
							<Text fontSize="3xl" fontWeight="bold" lineHeight="1">
								1.2s
							</Text>
							<HStack gap={1}>
								<Activity size={14} color="#22c55e" />
								<Text fontSize="xs" color="#22c55e" fontWeight="medium">
									-0.3s improvement
								</Text>
							</HStack>
						</Stack>
					</Widget>
				</GridItem>
			</Grid>

			{/* Row 2 — Project progress + recent activity */}
			<Grid
				templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
				gap={4}
				marginBlockEnd={6}
			>
				{/* Project Progress */}
				<GridItem>
					<Card title="Project Progress">
						<Stack gap={4}>
							{projects.map((project) => (
								<Box key={project.name}>
									<Flex
										justifyContent="space-between"
										alignItems="center"
										marginBlockEnd={1}
									>
										<Text fontSize="sm" fontWeight="medium">
											{project.name}
										</Text>
										<StatusBadge label={project.status} color={project.color} />
									</Flex>
									<Progress
										value={project.progress}
										size="sm"
										label={`${project.progress}%`}
										showValue={false}
									/>
								</Box>
							))}
						</Stack>
					</Card>
				</GridItem>

				{/* Recent Activity */}
				<GridItem>
					<Card title="Recent Activity">
						<Stack gap={3}>
							{activities.map((activity) => (
								<HStack
									key={activity.description}
									gap={3}
									alignItems="flex-start"
								>
									<Box
										color={activity.iconColor}
										flexShrink={0}
										paddingBlockStart="2px"
									>
										{activity.icon}
									</Box>
									<Box flex="1" minW={0}>
										<Text fontSize="sm" lineClamp={2}>
											{activity.description}
										</Text>
										<Text
											fontSize="xs"
											color="fg.subtle"
											marginBlockStart={0.5}
										>
											{activity.timeAgo}
										</Text>
									</Box>
								</HStack>
							))}
						</Stack>
					</Card>
				</GridItem>
			</Grid>

			{/* Row 3 — Onboarding Wizard (full width) */}
			<Card title="Onboarding Wizard">
				<Stepper>
					<StepperStep name="profile" title="Profile Setup">
						<Stack gap={3} paddingBlockStart={2}>
							<Text fontSize="sm" color="fg.muted">
								Set up your personal profile, upload a photo, and configure your
								display preferences so your teammates can recognise you.
							</Text>
						</Stack>
					</StepperStep>

					<StepperStep name="team" title="Team Assignment">
						<Stack gap={3} paddingBlockStart={2}>
							<Text fontSize="sm" color="fg.muted">
								Join an existing team or create a new one. You can belong to
								multiple teams and switch context at any time from the top
								navigation.
							</Text>
						</Stack>
					</StepperStep>

					<StepperStep name="project" title="First Project">
						<Stack gap={3} paddingBlockStart={2}>
							<Text fontSize="sm" color="fg.muted">
								Create your first project, invite collaborators, and set a due
								date. Projects keep related tasks, files, and discussions in one
								place.
							</Text>
						</Stack>
					</StepperStep>

					<StepperCompleted>
						<Stack gap={2} paddingBlock={4} alignItems="center">
							<CheckCircle size={40} color="#22c55e" />
							<Text fontWeight="semibold" fontSize="lg">
								All done! You are ready to go.
							</Text>
							<Text fontSize="sm" color="fg.muted">
								Your workspace is set up. Head to the Projects page to get
								started.
							</Text>
						</Stack>
					</StepperCompleted>

					<StepperControls />
				</Stepper>
			</Card>
		</Box>
	);
};

// ---------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------

export const Default: Story = {
	render: () => <DashboardDemo />,
};
