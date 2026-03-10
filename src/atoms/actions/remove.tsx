import { Icon } from "@chakra-ui/react";
import { X } from "lucide-react";
import type React from "react";
import { Action, type ActionProps } from "./action";

export interface RemoveProps extends ActionProps {
	/** Accessible label for the remove button */
	removeLabel?: string;
}

export const Remove = ({
	ref,
	removeLabel = "Remove",
	...props
}: RemoveProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	return (
		<Action ref={ref} aria-label={removeLabel} {...props}>
			<Icon color="gray.500" asChild>
				<X />
			</Icon>
		</Action>
	);
};
