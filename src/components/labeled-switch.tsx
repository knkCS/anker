import { Box, Flex, Text } from "@chakra-ui/react";
import type React from "react";
import { Switch, type SwitchProps } from "../primitives/switch";

export interface LabeledSwitchProps extends SwitchProps {
	name: string;
	label: string;
}

export const LabeledSwitch = ({
	ref,
	...props
}: LabeledSwitchProps & { ref?: React.Ref<HTMLInputElement> }) => {
	const { name, label, ...rest } = props;

	return (
		<Box>
			<Text asChild>
				<Flex>{label}</Flex>
			</Text>
			<Switch id={name} ref={ref} {...rest} />
		</Box>
	);
};
LabeledSwitch.displayName = "LabeledSwitch";
