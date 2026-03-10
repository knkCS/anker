import { Icon } from "@chakra-ui/react";
import { GripVertical } from "lucide-react";
import type React from "react";
import { Action, type ActionProps } from "./action";

export interface HandleProps extends ActionProps {
	/** Accessible label for the drag handle */
	handleLabel?: string;
}

export const Handle = ({
	ref,
	handleLabel = "Drag to reorder",
	...props
}: HandleProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	return (
		<Action ref={ref} cursor="grab" aria-label={handleLabel} {...props}>
			<Icon color="subtle" asChild>
				<GripVertical />
			</Icon>
		</Action>
	);
};
Handle.displayName = "Handle";
