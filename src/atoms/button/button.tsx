import { type ButtonProps, Button as ChakraButton } from "@chakra-ui/react";

export type { ButtonProps };

export const Button = ({
	ref,
	...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	return (
		<ChakraButton
			size="md"
			variant={"secondary" as ButtonProps["variant"]}
			ref={ref}
			{...props}
		/>
	);
};
Button.displayName = "Button";
