import { Button, Flex, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Stepper, StepperCompleted, StepperStep } from "./stepper";
import { useStepperNextButton, useStepperPrevButton } from "./use-stepper";

const meta = {
	title: "Components/Stepper",
	component: Stepper,
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const StepperControls = () => {
	const prevProps = useStepperPrevButton();
	const nextProps = useStepperNextButton();
	return (
		<Flex gap={4} mt={4}>
			<Button variant="outline" {...prevProps} />
			<Button variant="solid" colorPalette="primary" {...nextProps} />
		</Flex>
	);
};

export const Default: Story = {
	render() {
		return (
			<Stepper step={0}>
				<StepperStep name="step-1" title="Account">
					<Text>Create your account</Text>
					<StepperControls />
				</StepperStep>
				<StepperStep name="step-2" title="Profile">
					<Text>Fill in your profile</Text>
					<StepperControls />
				</StepperStep>
				<StepperStep name="step-3" title="Review">
					<Text>Review your information</Text>
					<StepperControls />
				</StepperStep>
				<StepperCompleted>
					<Text>All steps completed!</Text>
				</StepperCompleted>
			</Stepper>
		);
	},
};

export const Vertical: Story = {
	render() {
		return (
			<Stepper step={0} orientation="vertical">
				<StepperStep name="step-1" title="Account">
					<Text>Create your account</Text>
					<StepperControls />
				</StepperStep>
				<StepperStep name="step-2" title="Profile">
					<Text>Fill in your profile</Text>
					<StepperControls />
				</StepperStep>
				<StepperStep name="step-3" title="Review">
					<Text>Review your information</Text>
					<StepperControls />
				</StepperStep>
				<StepperCompleted>
					<Text>All steps completed!</Text>
				</StepperCompleted>
			</Stepper>
		);
	},
};
