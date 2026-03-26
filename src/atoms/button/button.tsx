import {
	Button as ChakraButton,
	type ButtonProps as ChakraButtonProps,
} from "@chakra-ui/react";

// Extend ButtonProps to include custom variants defined in the @knkcs/anker
// theme (primary, secondary, link-gray) that are not in Chakra's default types.
export type ButtonProps = Omit<ChakraButtonProps, "variant"> & {
	variant?:
		| "solid"
		| "subtle"
		| "surface"
		| "outline"
		| "ghost"
		| "plain"
		| "primary"
		| "secondary"
		| "link"
		| "link-gray"
		| undefined;
};

export const Button = ({
	ref,
	...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	return (
		<ChakraButton
			size="md"
			variant={"secondary" as ChakraButtonProps["variant"]}
			ref={ref}
			{...(props as ChakraButtonProps)}
		/>
	);
};
Button.displayName = "Button";
