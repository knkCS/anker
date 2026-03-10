import type React from "react";
import type { FieldValues } from "react-hook-form";
import { FormField, type FormFieldProps } from "./form-field";

// @uiw/react-md-editor is an optional peer dependency
type MDEditorProps = {
	value?: string;
	onChange?: (value?: string) => void;
	minHeight?: number;
	maxHeight?: number;
	visibleDragbar?: boolean;
};

type MDEditorComponent = React.ComponentType<MDEditorProps> & {
	Markdown?: React.ComponentType<{ source?: string }>;
};

export interface MarkdownFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	/** The MDEditor component from @uiw/react-md-editor. Pass it to avoid hard dependency. */
	MDEditor?: MDEditorComponent;
	minHeight?: number;
	maxHeight?: number;
}

export function MarkdownField<T extends FieldValues>(
	props: MarkdownFieldProps<T>,
) {
	const {
		name,
		label,
		readOnly,
		MDEditor,
		minHeight = 200,
		maxHeight = 600,
		...rest
	} = props;

	return (
		<FormField<T> name={name} label={label} readOnly={readOnly} {...rest}>
			{(field) => {
				if (MDEditor) {
					if (readOnly && MDEditor.Markdown) {
						return <MDEditor.Markdown source={field.value} />;
					}
					return (
						<MDEditor
							value={field.value}
							onChange={(value) => field.onChange(value ?? "")}
							minHeight={minHeight}
							maxHeight={maxHeight}
							visibleDragbar
						/>
					);
				}

				// Fallback: plain textarea
				return (
					<textarea
						value={field.value ?? ""}
						onChange={(e) => field.onChange(e.target.value)}
						onBlur={field.onBlur}
						readOnly={readOnly}
						style={{
							padding: "0.75rem",
							border: "1px solid var(--chakra-colors-border)",
							borderRadius: "0.375rem",
							width: "100%",
							minHeight: `${minHeight}px`,
							resize: "vertical",
						}}
					/>
				);
			}}
		</FormField>
	);
}
(MarkdownField as { displayName?: string }).displayName = "MarkdownField";
