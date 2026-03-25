import { type ButtonProps, IconButton, Square } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import {
	Popover,
	PopoverBody,
	PopoverContent,
	PopoverTrigger,
} from "../primitives/popover";
import { FormField, type FormFieldProps } from "./form-field";

// react-colorful is an optional peer dependency
type HexColorPickerProps = {
	color?: string;
	onChange?: (color: string) => void;
};

export interface ColorPickerFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	size?: ButtonProps["size"];
	/** The HexColorPicker component from react-colorful. Pass it to avoid hard dependency. */
	ColorPicker?: React.ComponentType<HexColorPickerProps>;
}

export function ColorPickerField<T extends FieldValues>({
	ref,
	...props
}: ColorPickerFieldProps<T> & { ref?: React.Ref<HTMLButtonElement> }) {
	const { name, label, size = "md", readOnly, ColorPicker, ...rest } = props;

	return (
		<FormField<T> name={name} label={label} readOnly={readOnly} {...rest}>
			{(field) => (
				<Popover>
					<PopoverTrigger asChild>
						<IconButton
							ref={ref}
							size={size}
							w="fit-content"
							borderWidth="1px"
							rounded="md"
							p={1}
							variant="outline"
							disabled={readOnly}
							aria-label={`Color: ${field.value || "none"}`}
							aria-describedby={field["aria-describedby"]}
						>
							<Square rounded="sm" bg={field.value} size={6} />
						</IconButton>
					</PopoverTrigger>
					<PopoverContent width="auto" showArrow>
						<PopoverBody>
							{ColorPicker ? (
								<ColorPicker
									color={field.value}
									onChange={(color) => field.onChange(color)}
								/>
							) : (
								<input
									type="color"
									value={field.value || "#000000"}
									onChange={(e) => field.onChange(e.target.value)}
									style={{
										width: 200,
										height: 200,
										border: "none",
										cursor: "pointer",
									}}
								/>
							)}
						</PopoverBody>
					</PopoverContent>
				</Popover>
			)}
		</FormField>
	);
}
(ColorPickerField as { displayName?: string }).displayName = "ColorPickerField";
