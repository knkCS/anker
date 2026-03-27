import { Button } from "@chakra-ui/react";
import { Upload } from "lucide-react";
import type React from "react";
import { useCallback, useEffect } from "react";
import type { FieldValues } from "react-hook-form";
import { Box, Flex } from "../primitives/layout";
import { Text } from "../primitives/typography";
import { FormField, type FormFieldProps } from "./form-field";

// react-dropzone is an optional peer dependency
type DropzoneOptions = {
	noClick?: boolean;
	multiple?: boolean;
	disabled?: boolean;
	accept?: Record<string, string[]>;
	onDrop?: (files: File[]) => void;
};

type UseDropzoneReturn = {
	getRootProps: () => Record<string, any>;
	getInputProps: () => Record<string, any>;
	isDragActive: boolean;
	open: () => void;
};

export interface FileFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	/** Accept configuration for file types, e.g. { "image/*": [".png", ".jpg"] } */
	accept?: Record<string, string[]>;
	/** Allow multiple file selection. @default false */
	multiple?: boolean;
	/** Text shown when dragging files over. @default "Release to upload" */
	dragActiveText?: string;
	/** Text shown below the file preview. @default "Drag & drop a file to upload" */
	dropHintText?: string;
	/** Label for the upload button. @default "Choose File" */
	buttonLabel?: string;
	/** The useDropzone hook from react-dropzone. Pass it to avoid hard dependency. */
	useDropzone?: (options: DropzoneOptions) => UseDropzoneReturn;
}

export function FileField<T extends FieldValues>(props: FileFieldProps<T>) {
	const {
		name,
		label,
		accept,
		multiple = false,
		disabled,
		dragActiveText = "Release to upload",
		dropHintText = "Drag & drop a file to upload",
		buttonLabel = "Choose File",
		useDropzone,
		...rest
	} = props;

	return (
		<FormField<T> name={name} label={label} disabled={disabled} {...rest}>
			{(field) => {
				if (useDropzone) {
					return (
						<DropzoneContent
							field={field}
							accept={accept}
							multiple={multiple}
							disabled={disabled}
							dragActiveText={dragActiveText}
							dropHintText={dropHintText}
							buttonLabel={buttonLabel}
							useDropzone={useDropzone}
						/>
					);
				}

				// Fallback: native file input
				return (
					<Box>
						<input
							type="file"
							accept={
								accept ? Object.values(accept).flat().join(",") : undefined
							}
							multiple={multiple}
							disabled={disabled}
							aria-describedby={field["aria-describedby"]}
							onChange={(e) => {
								const files = e.target.files;
								if (!files) return;
								if (multiple) {
									field.onChange(Array.from(files));
								} else {
									field.onChange(files[0] || null);
								}
							}}
						/>
						{field.value && (
							<Text mt={2} fontSize="sm" color="fg.muted">
								{(field.value as File)?.name ?? "File selected"}
							</Text>
						)}
					</Box>
				);
			}}
		</FormField>
	);
}

FileField.displayName = "FileField";

interface DropzoneContentProps {
	field: {
		value: any;
		onChange: (...event: any[]) => void;
		onBlur: () => void;
		ref: React.Ref<any>;
		name: string;
	};
	accept?: Record<string, string[]>;
	multiple: boolean;
	disabled?: boolean;
	dragActiveText: string;
	dropHintText: string;
	buttonLabel: string;
	useDropzone: (options: DropzoneOptions) => UseDropzoneReturn;
}

const DropzoneContent: React.FC<DropzoneContentProps> = ({
	field,
	accept,
	multiple,
	disabled,
	dragActiveText,
	dropHintText,
	buttonLabel,
	useDropzone,
}) => {
	const handleDrop = useCallback(
		(files: File[]) => {
			if (multiple) {
				field.onChange(files);
			} else {
				const file = files[0];
				if (file) {
					field.onChange(
						Object.assign(file, {
							preview: URL.createObjectURL(file),
						}),
					);
				}
			}
		},
		[field, multiple],
	);

	useEffect(() => {
		return () => {
			if (field.value?.preview) {
				URL.revokeObjectURL(field.value.preview);
			}
		};
	}, [field.value]);

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		noClick: true,
		multiple,
		disabled,
		accept,
		onDrop: handleDrop,
	});

	return (
		<Box {...getRootProps()}>
			<Box display="none" {...getInputProps()} asChild>
				<input />
			</Box>
			<Box
				bgColor="bg.muted"
				p={4}
				rounded="md"
				overflow="hidden"
				position="relative"
				textAlign="center"
			>
				{isDragActive && (
					<Flex
						pointerEvents="none"
						top="0"
						insetInlineStart="0"
						position="absolute"
						backgroundColor="blackAlpha.400"
						width="100%"
						height="100%"
						zIndex={1}
						alignItems="center"
						justifyContent="center"
						direction="column"
						color="white"
						gap="3"
					>
						<Upload size={48} />
						<Text fontSize="lg" fontWeight="bold">
							{dragActiveText}
						</Text>
					</Flex>
				)}
				{field.value?.name && (
					<Text fontSize="sm" color="fg.muted">
						{field.value.name}
					</Text>
				)}
				<Text color="fg.muted" fontSize="xs" mt={2}>
					{dropHintText}
				</Text>
				<Button mt={2} size="sm" variant="outline" onClick={open}>
					<Upload size={14} />
					{buttonLabel}
				</Button>
			</Box>
		</Box>
	);
};
