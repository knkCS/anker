import { Icon } from "@chakra-ui/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type React from "react";
import { Action, type ActionProps } from "./action";

export interface CollapseProps extends ActionProps {
	collapsed: boolean;
	/** Accessible label for the collapse button */
	collapseLabel?: string;
}

export const Collapse = ({
	ref,
	collapseLabel = "Collapse",
	...props
}: CollapseProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	const { collapsed, ...rest } = props;

	return (
		<Action ref={ref} cursor="pointer" aria-label={collapseLabel} {...rest}>
			<Icon color="gray.500">
				{collapsed ? <ChevronRight /> : <ChevronDown />}
			</Icon>
		</Action>
	);
};
