import {
	IconButton as ChakraIconButton,
	type IconButtonProps,
} from "@chakra-ui/react";

export type { IconButtonProps };

export const IconButton = ({
	ref,
	colorPalette = "primary",
	...props
}: IconButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	return (
		<ChakraIconButton
			size="md"
			variant="ghost"
			colorPalette={colorPalette}
			ref={ref}
			{...props}
		/>
	);
};
IconButton.displayName = "IconButton";
