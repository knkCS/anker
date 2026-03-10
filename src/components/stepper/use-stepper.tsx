import { createContext } from "@chakra-ui/react";
import React, { useCallback } from "react";

export const [StepperProvider, useStepperContext] =
	createContext<UseStepperReturn>({
		name: "StepperContext",
		errorMessage:
			"useStepperContext: `context` is undefined. Seems you forgot to wrap stepper components in `<Stepper />`",
	});

export interface UseStepperProps {
	step?: number | string;
	isCompleted?: boolean;
	onChange?(index: number): void;
}

export function useStepper(props: UseStepperProps) {
	const { step, onChange } = props;

	const [activeIndex, setIndex] = React.useState(-1); // Set to -1 by default to prevent any initial transitions.

	const stepsRef = React.useRef<string[]>([]);

	const registerStep = React.useCallback((name: string) => {
		const newSteps = [...stepsRef.current];

		if (newSteps.indexOf(name) === -1) {
			newSteps.push(name);
		}

		stepsRef.current = newSteps;
	}, []);

	const unregisterStep = React.useCallback((name: string) => {
		stepsRef.current = stepsRef.current.filter((step) => step !== name);
	}, []);

	const setStep = useCallback((name: string) => {
		const i = stepsRef.current.indexOf(name);
		if (i !== -1) {
			setIndex(i);
		}
	}, []);

	const nextStep = () => {
		setIndex(activeIndex + 1);
	};

	const prevStep = () => {
		setIndex(activeIndex - 1);
	};

	React.useEffect(() => {
		if (typeof step === "string") {
			setStep(step);
		} else if (typeof step === "number") {
			setIndex(step);
		} else if (activeIndex === -1) {
			setIndex(0); // initiate the stepper by activating the first step
		}
	}, [step, activeIndex, setStep]);

	React.useEffect(() => {
		onChange?.(activeIndex);
	}, [activeIndex, onChange]);

	const context = {
		stepsRef,
		activeStep: stepsRef.current[activeIndex],
		activeIndex,
		isFirstStep: activeIndex === 0,
		isLastStep: activeIndex === stepsRef.current.length - 1,
		isCompleted: activeIndex >= stepsRef.current.length,
		setIndex,
		setStep,
		nextStep,
		prevStep,
		registerStep,
		unregisterStep,
	};

	return context;
}

export type UseStepperReturn = ReturnType<typeof useStepper>;

export interface UseStepProps {
	name?: string;
	isActive?: boolean;
	isCompleted?: boolean;
}

export function useStep(props: UseStepProps) {
	const { name, isActive, isCompleted } = props;
	const { registerStep, unregisterStep, activeStep } = useStepperContext();

	React.useEffect(() => {
		if (!name) {
			return;
		}
		registerStep(name);

		return () => {
			unregisterStep(name);
		};
	}, [name, registerStep, unregisterStep]);

	return {
		isActive: name ? activeStep === name : isActive,
		isCompleted,
	};
}

/**
 * Returns props for a Prev Button
 */
export function useStepperPrevButton({ label = "Back" } = {}) {
	const { isFirstStep, prevStep } = useStepperContext();

	return {
		disabled: isFirstStep,
		onClick: prevStep,
		children: label,
	};
}

/**
 * Returns props for a Next Button
 */
export function useStepperNextButton({
	label = "Next",
	submitLabel = "Submit",
} = {}) {
	const { isLastStep, isCompleted, nextStep } = useStepperContext();

	return {
		disabled: isCompleted,
		onClick: nextStep,
		children: isLastStep ? submitLabel : label,
	};
}
