import { chakra, type HTMLChakraProps } from "@chakra-ui/react";
import type React from "react";
import { createContext, useContext } from "react";
import { Avatar, type AvatarProps } from "../../primitives/avatar";

export interface PersonaProps {
	/**
	 * The name of the person in the avatar.
	 *
	 * - if `src` has loaded, the name will be used as the `alt` attribute of the `img`
	 * - If `src` is not loaded, the name will be used to create the initials
	 */
	name?: string;

	/**
	 * Primary label of the persona, defaults to the name
	 */
	label?: React.ReactNode;
	/**
	 * Hide the persona details next to the avatar.
	 */
	hideDetails?: boolean;
	/**
	 * The size of the persona, from 2xs to 2xl.
	 */
	size?: "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
	/**
	 * When true, adds hover styling and pointer cursor for clickable personas.
	 */
	interactive?: boolean;
}

interface PersonaStyles {
	container?: React.CSSProperties;
	details?: React.CSSProperties;
	label?: React.CSSProperties;
}

const PersonaStylesContext = createContext<PersonaStyles>({});
const usePersonaStyles = () => useContext(PersonaStylesContext);

export const Persona: React.FC<PersonaProps> = (props) => {
	const { name, size = "sm", hideDetails, label, interactive } = props;

	return (
		<PersonaContainer interactive={interactive}>
			<PersonaAvatar name={name} size={size} />
			{!hideDetails && (
				<PersonaDetails>
					<PersonaLabel>{label || name}</PersonaLabel>
				</PersonaDetails>
			)}
		</PersonaContainer>
	);
};

Persona.displayName = "Persona";

export interface PersonaContainerProps extends HTMLChakraProps<"div"> {
	children: React.ReactNode;
	/**
	 * Optional style overrides passed down to child components via context.
	 */
	styles?: PersonaStyles;
	/**
	 * When true, adds hover styling and pointer cursor for clickable personas.
	 */
	interactive?: boolean;
}

export const PersonaContainer = ({
	ref,
	...props
}: PersonaContainerProps & { ref?: React.Ref<HTMLDivElement> }) => {
	const { children, styles = {}, interactive, ...rest } = props;

	return (
		<PersonaStylesContext.Provider value={styles}>
			<chakra.div
				ref={ref}
				display="flex"
				flexDirection="row"
				alignItems="center"
				{...(interactive && {
					cursor: "pointer",
					borderRadius: "md",
					transition: "background-color 150ms",
					_hover: { bg: "bg-subtle" },
					px: 2,
					py: 1,
				})}
				{...rest}
			>
				{children}
			</chakra.div>
		</PersonaStylesContext.Provider>
	);
};

interface PersonaAvatarOptions extends Pick<PersonaProps, "name" | "size"> {}

interface PersonaAvatarProps
	extends PersonaAvatarOptions,
		Omit<AvatarProps, "size"> {}

export const PersonaAvatar = ({
	ref,
	...props
}: PersonaAvatarProps & { ref?: React.Ref<HTMLDivElement> }) => {
	const { name, size, ...rest } = props;

	return <Avatar ref={ref} name={name} size={size} {...rest} />;
};

export const PersonaDetails = ({
	ref,
	...props
}: HTMLChakraProps<"div"> & { ref?: React.Ref<HTMLDivElement> }) => {
	const { children, ...rest } = props;
	const styles = usePersonaStyles();

	return (
		<chakra.div
			ref={ref}
			display="flex"
			flexDirection="column"
			style={styles.details}
			{...rest}
		>
			{children}
		</chakra.div>
	);
};

export const PersonaLabel = ({
	ref,
	...props
}: HTMLChakraProps<"span"> & { ref?: React.Ref<HTMLSpanElement> }) => {
	const styles = usePersonaStyles();

	return <chakra.span ref={ref} style={styles.label} {...props} />;
};
