import {
	type ButtonProps,
	IconButton,
	Popover,
	Square,
} from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
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
				<Popover.Root>
					<Popover.Trigger asChild>
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
						>
							<Square rounded="sm" bg={field.value} size={6} />
						</IconButton>
					</Popover.Trigger>
					<Popover.Positioner>
						<Popover.Content width="auto">
							<Popover.Arrow />
							<Popover.Body>
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
							</Popover.Body>
						</Popover.Content>
					</Popover.Positioner>
				</Popover.Root>
			)}
		</FormField>
	);
}
