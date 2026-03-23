import {
	NativeSelect as ChakraNativeSelect,
	type NativeSelectFieldProps,
	type NativeSelectRootProps,
} from "@chakra-ui/react";
import type * as React from "react";

export interface NativeSelectProps
	extends Omit<NativeSelectFieldProps, "placeholder"> {
	/** Props forwarded to the root wrapper. */
	size?: NativeSelectRootProps["size"];
	variant?: NativeSelectRootProps["variant"];
	disabled?: NativeSelectRootProps["disabled"];
	invalid?: NativeSelectRootProps["invalid"];
	unstyled?: NativeSelectRootProps["unstyled"];
	/** Rendered as a disabled first <option> */
	placeholder?: string;
}

export const NativeSelect = function NativeSelect({
	ref,
	...props
}: NativeSelectProps & { ref?: React.Ref<HTMLSelectElement> }) {
	const {
		size,
		variant,
		disabled,
		invalid,
		unstyled,
		placeholder,
		children,
		...fieldProps
	} = props;

	return (
		<ChakraNativeSelect.Root
			size={size}
			variant={variant}
			disabled={disabled}
			invalid={invalid}
			unstyled={unstyled}
		>
			<ChakraNativeSelect.Field ref={ref} {...fieldProps}>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{children}
			</ChakraNativeSelect.Field>
			<ChakraNativeSelect.Indicator />
		</ChakraNativeSelect.Root>
	);
};
NativeSelect.displayName = "NativeSelect";
