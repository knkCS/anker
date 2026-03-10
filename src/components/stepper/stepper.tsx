import {
	Collapsible,
	chakra,
	type HTMLChakraProps,
	type SystemStyleObject,
	useSlotRecipe,
} from "@chakra-ui/react";
import { Check } from "lucide-react";
import React, { createContext, useContext } from "react";
import {
	StepperProvider,
	type UseStepperProps,
	useStep,
	useStepper,
	useStepperContext,
} from "./use-stepper";

// ---------------------------------------------------------------------------
// Inlined helpers (from core utils)
// ---------------------------------------------------------------------------

function getChildOfType(children: React.ReactNode, type: React.ComponentType) {
	return (React.Children.toArray(children) as React.ReactElement[]).find(
		(item) => item.type === type,
	);
}

function getChildrenOfType<P = Record<string, unknown>>(
	children: React.ReactNode,
	type: React.ComponentType<P> | React.ComponentType<P>[],
) {
	return (React.Children.toArray(children) as React.ReactElement<P>[]).filter(
		(item) =>
			Array.isArray(type)
				? type.some((component) => component === item.type)
				: item.type === type,
	);
}

// Simple replacement for the removed dataAttr helper
const dataAttr = (condition: boolean | undefined) =>
	condition ? "" : undefined;

// Simple replacement for the removed cx helper
const cx = (...classes: (string | undefined)[]) =>
	classes.filter(Boolean).join(" ");

// ---------------------------------------------------------------------------
// Styles context -- populated by useSlotRecipe in StepperContainer
// ---------------------------------------------------------------------------

type StepperStyles = Record<string, SystemStyleObject>;

const StylesContext = createContext<StepperStyles>({});
const useStyles = () => useContext(StylesContext);

// ---------------------------------------------------------------------------

export interface StepperProps
	extends UseStepperProps,
		Omit<HTMLChakraProps<"div">, "onChange"> {
	orientation?: "horizontal" | "vertical";
	variant?: "subtle" | "solid";
	size?: "md" | "lg";
}

/**
 * Display progress in multi-step workflows.
 *
 * Can be controlled or uncontrolled.
 */
export const Stepper = ({
	ref,
	...props
}: StepperProps & { ref?: React.Ref<HTMLDivElement> }) => {
	const { orientation, children, ...containerProps } = props;
	return (
		<StepperContainer ref={ref} orientation={orientation} {...containerProps}>
			<StepperSteps orientation={orientation}>{children}</StepperSteps>
		</StepperContainer>
	);
};

export const StepperContainer = ({
	ref,
	...props
}: StepperProps & { ref?: React.Ref<HTMLDivElement> }) => {
	const {
		children,
		orientation = "horizontal",
		variant,
		size,
		onChange,
		...rest
	} = props;

	const context = useStepper(props);

	const recipe = useSlotRecipe({ key: "stepper" });
	const styles = recipe({ variant, size, orientation });

	return (
		<StylesContext.Provider value={styles}>
			<StepperProvider value={context}>
				<chakra.div
					ref={ref}
					css={styles.container}
					{...rest}
					className={cx("stepper", props.className)}
				>
					{children}
				</chakra.div>
			</StepperProvider>
		</StylesContext.Provider>
	);
};

export interface StepperStepsProps extends HTMLChakraProps<"div"> {
	orientation?: "horizontal" | "vertical";
	stepComponent?: React.JSXElementConstructor<StepperStepProps>;
}

/**
 * Wrapper element containing the steps.
 */
export const StepperSteps: React.FC<StepperStepsProps> = (props) => {
	const {
		children,
		orientation = "horizontal",
		stepComponent,
		...rest
	} = props;
	const styles = useStyles();

	const { activeIndex } = useStepperContext();

	const isVertical = orientation === "vertical";

	const Step = stepComponent || StepperStep;

	const steps = getChildrenOfType(children, Step);

	const elements = steps.reduce<React.ReactElement[]>((memo, step, i, arr) => {
		memo.push(
			<Step
				key={step.key}
				{...step.props}
				icon={step.props.icon || i + 1}
				isActive={activeIndex === i}
				isCompleted={step.props.isCompleted || activeIndex > i}
			/>,
		);

		if (isVertical) {
			memo.push(
				<StepperContent key={`content-${step.key}`} open={activeIndex === i}>
					{step.props.children}
				</StepperContent>,
			);
		}

		if (i < arr.length - 1) {
			memo.push(
				<StepperSeparator
					key={`separator-${step.key}`}
					isActive={i < activeIndex}
				/>,
			);
		}

		return memo;
	}, []);

	const completed = getChildOfType(children, StepperCompleted);

	const content =
		activeIndex >= steps.length ? (
			completed
		) : !isVertical ? (
			<StepperContent>{steps[activeIndex]?.props?.children}</StepperContent>
		) : null;

	return (
		<>
			<chakra.div
				css={styles.steps}
				{...rest}
				className={cx("stepper__steps", props.className)}
			>
				{elements}
			</chakra.div>
			{content}
		</>
	);
};

StepperSteps.displayName = "StepperSteps";

export interface StepperContentProps extends HTMLChakraProps<"div"> {
	/**
	 * Show or hide the content
	 */
	open?: boolean;
}

/**
 * Renders the step content, is collapsible.
 */
export const StepperContent: React.FC<StepperContentProps> = (props) => {
	const { children, open = true, ...rest } = props;
	const styles = useStyles();

	return (
		<chakra.div
			css={styles.content}
			{...rest}
			className={cx("stepper__content", props.className)}
		>
			<Collapsible.Root open={open}>
				<Collapsible.Content>{children}</Collapsible.Content>
			</Collapsible.Root>
		</chakra.div>
	);
};

StepperContent.displayName = "StepperContent";

export interface StepperIconProps extends HTMLChakraProps<"div"> {
	icon: React.ReactNode;
	isActive?: boolean;
	isCompleted?: boolean;
}

/**
 * Displays the current step or a completed icon.
 */
export const StepperIcon: React.FC<StepperIconProps> = (props) => {
	const { icon, isActive, isCompleted, className, ...rest } = props;

	const styles = useStyles();

	const content: React.ReactNode = isCompleted ? <Check size={14} /> : icon;

	return (
		<chakra.div
			css={styles.icon}
			{...rest}
			className={cx("stepper__icon", className)}
			data-active={dataAttr(isActive)}
		>
			{content}
		</chakra.div>
	);
};

StepperIcon.displayName = "StepperIcon";

export interface StepperStepProps
	extends Omit<HTMLChakraProps<"div">, "title"> {
	/**
	 * The step title
	 */
	title: React.ReactNode;
	/**
	 * The step name, used for controlled steppers
	 */
	name?: string;
	/**
	 * Show an icon instead of the step number
	 */
	icon?: React.ReactNode;
	isActive?: boolean;
	isCompleted?: boolean;
}

/**
 * Displays the icon and step title.
 */
export const StepperStep: React.FC<StepperStepProps> = (props) => {
	const { title, icon, isActive, isCompleted, ...rest } = props;
	const step = useStep(props);
	const styles = useStyles();

	return (
		<chakra.div
			{...rest}
			css={styles.step}
			data-active={dataAttr(step.isActive)}
			data-completed={dataAttr(step.isCompleted)}
			aria-current={step.isActive ? "step" : undefined}
			className={cx("stepper__step", props.className)}
		>
			<StepperIcon icon={icon} isActive={isActive} isCompleted={isCompleted} />
			{title && <StepperStepTitle>{title}</StepperStepTitle>}
		</chakra.div>
	);
};

StepperStep.displayName = "StepperStep";

export interface StepperSeparatorProps extends HTMLChakraProps<"div"> {
	isActive?: boolean;
}

/**
 * The separator between steps.
 */
export const StepperSeparator: React.FC<StepperSeparatorProps> = (props) => {
	const { isActive, ...rest } = props;
	const styles = useStyles();

	return (
		<chakra.div
			{...rest}
			data-active={dataAttr(isActive)}
			className={cx("stepper__separator", props.className)}
			css={styles.separator}
		/>
	);
};

StepperSeparator.displayName = "StepperSeparator";

/**
 * The step title.
 */
export const StepperStepTitle: React.FC<HTMLChakraProps<"p">> = (props) => {
	const styles = useStyles();
	return (
		<chakra.p
			{...props}
			css={styles.title}
			className={cx("stepper__title", props.className)}
		/>
	);
};

StepperStepTitle.displayName = "StepperStepTitle";

/**
 * Shown when all steps have completed.
 */
export const StepperCompleted: React.FC<HTMLChakraProps<"div">> = (props) => {
	const styles = useStyles();
	return (
		<chakra.div
			css={styles.completed}
			{...props}
			className={cx("stepper__completed", props.className)}
		/>
	);
};

StepperCompleted.displayName = "StepperCompleted";
