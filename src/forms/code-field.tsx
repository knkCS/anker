import type React from "react";
import { useCallback } from "react";
import type { FieldValues } from "react-hook-form";
import { FormField, type FormFieldProps } from "./form-field";

// @monaco-editor/react is an optional peer dependency
type MonacoEditorProps = {
	value?: string;
	language?: string;
	onChange?: (value: string | undefined) => void;
	onMount?: (editor: any, monaco: any) => void;
	height?: string;
	options?: Record<string, any>;
};

export interface CodeFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	language?: string;
	placeholder?: string;
	height?: string;
	indentWithTab?: boolean;
	/** The Monaco Editor component. Pass it to avoid hard dependency on @monaco-editor/react. */
	Editor?: React.ComponentType<MonacoEditorProps>;
}

export function CodeField<T extends FieldValues>({
	ref,
	...props
}: CodeFieldProps<T> & { ref?: React.Ref<any> }) {
	const {
		name,
		label,
		language = "typescript",
		height = "400px",
		indentWithTab = true,
		readOnly,
		Editor,
		...rest
	} = props;

	const onMount = useCallback(
		(editorInstance: any, _monaco: any) => {
			if (typeof ref === "function") {
				ref(editorInstance);
			} else if (ref && typeof ref === "object") {
				(ref as React.MutableRefObject<any>).current = editorInstance;
			}
			editorInstance.updateOptions?.({
				tabCompletion: indentWithTab ? "on" : "off",
			});
		},
		[ref, indentWithTab],
	);

	return (
		<FormField<T> name={name} label={label} readOnly={readOnly} {...rest}>
			{(field) =>
				Editor ? (
					<Editor
						value={field.value}
						language={language}
						onChange={(value) => field.onChange(value ?? "")}
						onMount={onMount}
						height={height}
						options={{
							readOnly,
							wordWrap: "on",
							minimap: { enabled: false },
							scrollBeyondLastLine: false,
							tabCompletion: indentWithTab ? "on" : "off",
						}}
					/>
				) : (
					<textarea
						value={field.value ?? ""}
						onChange={(e) => field.onChange(e.target.value)}
						onBlur={field.onBlur}
						readOnly={readOnly}
						aria-describedby={field["aria-describedby"]}
						style={{
							fontFamily: "monospace",
							fontSize: "0.875rem",
							padding: "0.75rem",
							border: "1px solid var(--chakra-colors-border)",
							borderRadius: "0.375rem",
							width: "100%",
							minHeight: height,
							resize: "vertical",
						}}
					/>
				)
			}
		</FormField>
	);
}
(CodeField as { displayName?: string }).displayName = "CodeField";
