import { Box } from "@chakra-ui/react";
import type React from "react";

export interface ActionProps extends React.HTMLAttributes<HTMLButtonElement> {
	cursor?: string;
}

export const Action = ({
	ref,
	cursor,
	color,
	...props
}: ActionProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	return (
		<Box
			display="flex"
			alignItems={"center"}
			justifyContent={"center"}
			borderRadius={"5px"}
			p={"15px"}
			tabIndex={0}
			cursor={cursor}
			transition={"background-color 150ms, color 150ms, opacity 150ms"}
			bg={color}
			asChild
		>
			<button type="button" ref={ref} {...props} />
		</Box>
	);
};
