import { Icon } from "@chakra-ui/react";
import { Pencil } from "lucide-react";
import type React from "react";
import { Action, type ActionProps } from "./action";

export interface EditProps extends ActionProps {
	/** Accessible label for the edit button */
	editLabel?: string;
}

export const Edit = ({
	ref,
	editLabel = "Edit",
	...props
}: EditProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	return (
		<Action ref={ref} cursor="pointer" aria-label={editLabel} {...props}>
			<Icon color="subtle" asChild>
				<Pencil />
			</Icon>
		</Action>
	);
};
Edit.displayName = "Edit";
