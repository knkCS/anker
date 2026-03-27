import {
	AlertCircle,
	Check,
	ChevronDown,
	ChevronUp,
	Clock,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { IconButton } from "../atoms/button";
import { Box, Flex, HStack, Stack } from "../primitives/layout";
import { Progress } from "../primitives/progress";
import { Spinner } from "../primitives/spinner";
import { Text } from "../primitives/typography";

export interface UploadFileStatus {
	id: string;
	filename: string;
	status: "pending" | "uploading" | "processing" | "done" | "error";
	progress?: number;
	error?: string;
}

export interface UploadToastStackProps {
	files: UploadFileStatus[];
	onDismiss: () => void;
	autoDismissMs?: number;
	defaultExpanded?: boolean;
}

const FileStatusIcon = ({ status }: { status: UploadFileStatus["status"] }) => {
	switch (status) {
		case "pending":
			return <Clock size={14} color="var(--chakra-colors-fg-muted)" />;
		case "uploading":
		case "processing":
			return <Spinner size="xs" />;
		case "done":
			return <Check size={14} color="var(--chakra-colors-green-500)" />;
		case "error":
			return <AlertCircle size={14} color="var(--chakra-colors-red-500)" />;
	}
};

export const UploadToastStack = ({
	files,
	onDismiss,
	autoDismissMs = 5000,
	defaultExpanded = true,
}: UploadToastStackProps) => {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const [hovered, setHovered] = useState(false);

	const allComplete = files.every(
		(f) => f.status === "done" || f.status === "error",
	);
	const totalProgress =
		files.length > 0
			? files.reduce((sum, f) => sum + (f.progress ?? 0), 0) / files.length
			: 0;
	const doneCount = files.filter((f) => f.status === "done").length;
	const errorCount = files.filter((f) => f.status === "error").length;

	const headerText = allComplete
		? `${doneCount} file${doneCount !== 1 ? "s" : ""} uploaded${errorCount > 0 ? `, ${errorCount} failed` : ""}`
		: `Uploading ${files.length} file${files.length !== 1 ? "s" : ""}...`;

	useEffect(() => {
		if (!allComplete || hovered || autoDismissMs === 0) return;
		const timer = setTimeout(onDismiss, autoDismissMs);
		return () => clearTimeout(timer);
	}, [allComplete, hovered, autoDismissMs, onDismiss]);

	if (files.length === 0) return null;

	return (
		<Box
			position="fixed"
			bottom={4}
			insetInlineEnd={4}
			zIndex="toast"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<Box
				bg="bg.surface"
				shadow="lg"
				rounded="lg"
				borderWidth="1px"
				borderColor="border"
				w="320px"
				overflow="hidden"
			>
				{/* Header */}
				<Flex align="center" px={3} py={2} gap={1}>
					<Text fontSize="sm" fontWeight="medium" flex="1">
						{headerText}
					</Text>
					<IconButton
						aria-label={
							expanded ? "Collapse upload list" : "Expand upload list"
						}
						size="xs"
						variant="ghost"
						onClick={() => setExpanded((v) => !v)}
					>
						{expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
					</IconButton>
					<IconButton
						aria-label="Dismiss upload toast"
						size="xs"
						variant="ghost"
						onClick={onDismiss}
					>
						<X size={14} />
					</IconButton>
				</Flex>

				{/* Overall progress bar */}
				<Progress
					value={totalProgress}
					size="xs"
					colorPalette={allComplete && errorCount === 0 ? "green" : "primary"}
				/>

				{/* Per-file list */}
				{expanded && (
					<Stack gap={0} maxH="200px" overflowY="auto" px={3} py={2}>
						{files.map((file) => (
							<Box key={file.id} py={1}>
								<HStack gap={2} align="center">
									<Box flexShrink={0}>
										<FileStatusIcon status={file.status} />
									</Box>
									<Text
										fontSize="sm"
										flex="1"
										overflow="hidden"
										textOverflow="ellipsis"
										whiteSpace="nowrap"
										title={file.filename}
									>
										{file.filename}
									</Text>
									{file.progress !== undefined && (
										<Text fontSize="xs" color="fg.muted" flexShrink={0}>
											{Math.round(file.progress)}%
										</Text>
									)}
								</HStack>
								{file.status === "error" && file.error && (
									<Text fontSize="xs" color="fg.error" ps={5}>
										{file.error}
									</Text>
								)}
							</Box>
						))}
					</Stack>
				)}
			</Box>
		</Box>
	);
};

UploadToastStack.displayName = "UploadToastStack";
