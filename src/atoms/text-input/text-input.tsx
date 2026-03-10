import { Group, Input, InputAddon, type InputProps } from "@chakra-ui/react";
import type React from "react";

export interface TextInputProps extends InputProps {
	append?: string | React.ReactElement;
	prepend?: string | React.ReactElement;
}

const TextInput = ({
	ref,
	...props
}: TextInputProps & { ref?: React.Ref<HTMLInputElement> }) => {
	const { name, append, prepend, size, ...rest } = props;
	return (
		<Group attached w="full">
			{prepend && prepend !== "" && <InputAddon>{prepend}</InputAddon>}
			<Input id={name} size={size} {...rest} ref={ref} />
			{append && append !== "" && <InputAddon>{append}</InputAddon>}
		</Group>
	);
};

export default TextInput;
