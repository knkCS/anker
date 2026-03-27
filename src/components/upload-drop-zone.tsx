import { Upload } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "../atoms/button";
import { Box, HStack, Stack } from "../primitives/layout";
import { Text } from "../primitives/typography";

export interface UploadDropZoneProps {
	onFiles: (files: File[]) => void;
	onError?: (error: { file: File; reason: "size" | "type" }) => void;
	accept?: string;
	multiple?: boolean;
	compact?: boolean;
	disabled?: boolean;
	children?: React.ReactNode;
	maxSize?: number;
	dragActiveText?: string;
	dropHintText?: string;
	buttonLabel?: string;
}

function matchesAccept(file: File, accept: string): boolean {
	const tokens = accept.split(",").map((t) => t.trim());
	for (const token of tokens) {
		if (token.startsWith(".")) {
			if (file.name.toLowerCase().endsWith(token.toLowerCase())) {
				return true;
			}
		} else if (token.includes("/*")) {
			const prefix = token.slice(0, token.indexOf("/*"));
			if (file.type.startsWith(prefix)) {
				return true;
			}
		} else {
			if (file.type === token) {
				return true;
			}
		}
	}
	return false;
}

export const UploadDropZone = ({
	onFiles,
	onError,
	accept,
	multiple = true,
	compact = false,
	disabled = false,
	children,
	maxSize,
	dragActiveText = "Release to upload",
	dropHintText = "Drag and drop files here",
	buttonLabel = "Browse Files",
}: UploadDropZoneProps) => {
	const [isDragActive, setIsDragActive] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const processFiles = (fileList: FileList | File[]) => {
		const files = Array.from(fileList);
		const accepted: File[] = [];

		for (const file of files) {
			if (maxSize !== undefined && file.size > maxSize) {
				onError?.({ file, reason: "size" });
				continue;
			}
			if (accept && !matchesAccept(file, accept)) {
				onError?.({ file, reason: "type" });
				continue;
			}
			accepted.push(file);
		}

		if (accepted.length > 0) {
			onFiles(multiple ? accepted : [accepted[0]]);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!disabled) {
			setIsDragActive(true);
		}
	};

	const handleDragLeave = () => {
		setIsDragActive(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragActive(false);
		if (disabled) return;
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			processFiles(e.dataTransfer.files);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			processFiles(e.target.files);
		}
		e.target.value = "";
	};

	const handleBrowseClick = () => {
		if (!disabled) {
			inputRef.current?.click();
		}
	};

	const defaultContent = isDragActive ? (
		<Text color="fg.muted" fontSize="sm">
			{dragActiveText}
		</Text>
	) : compact ? (
		<HStack gap={3} align="center">
			<Upload size={24} />
			<Text color="fg.muted" fontSize="sm">
				{dropHintText}
			</Text>
			<Button
				variant="outline"
				size="sm"
				onClick={handleBrowseClick}
				disabled={disabled}
			>
				{buttonLabel}
			</Button>
		</HStack>
	) : (
		<Stack align="center" gap={3}>
			<Upload size={48} />
			<Text color="fg.muted" fontSize="sm">
				{dropHintText}
			</Text>
			<Button
				variant="outline"
				size="sm"
				onClick={handleBrowseClick}
				disabled={disabled}
			>
				{buttonLabel}
			</Button>
		</Stack>
	);

	return (
		<Box
			borderStyle="dashed"
			borderWidth="2px"
			borderColor={isDragActive ? "accent" : "border"}
			bg={isDragActive ? "bg.accent-subtle" : "bg.subtle"}
			rounded="lg"
			textAlign="center"
			transition="all 0.2s"
			p={compact ? 3 : 6}
			opacity={disabled ? 0.5 : 1}
			cursor={disabled ? "not-allowed" : "default"}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				style={{ display: "none" }}
				onChange={handleInputChange}
				disabled={disabled}
			/>
			{children !== undefined ? children : defaultContent}
		</Box>
	);
};

UploadDropZone.displayName = "UploadDropZone";
