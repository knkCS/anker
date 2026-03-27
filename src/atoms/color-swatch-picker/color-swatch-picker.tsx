import type React from "react";
import { useEffect, useState } from "react";
import { Box, Flex, HStack, Stack } from "../../primitives/layout";
import { TextInput } from "../text-input";

const DEFAULT_PRESETS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
	"#14b8a6",
	"#6b7280",
];

export interface ColorSwatchPickerProps {
	value?: string;
	onChange: (color: string) => void;
	presets?: string[];
	showHexInput?: boolean;
	showPreview?: boolean;
	size?: "sm" | "md" | "lg";
}

const SWATCH_SIZES = { sm: 4, md: 5, lg: 7 } as const;

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
	value,
	onChange,
	presets = DEFAULT_PRESETS,
	showHexInput = false,
	showPreview = false,
	size = "md",
}) => {
	const [hexInput, setHexInput] = useState(value ?? "");

	useEffect(() => {
		setHexInput(value ?? "");
	}, [value]);

	const swatchSize = SWATCH_SIZES[size];

	const handleHexSubmit = () => {
		const trimmed = hexInput.trim();
		if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
			onChange(trimmed);
		}
	};

	return (
		<Stack gap={3}>
			<Flex wrap="wrap" gap={2}>
				{presets.map((color) => (
					<Box
						key={color}
						w={swatchSize}
						h={swatchSize}
						rounded="sm"
						bg={color}
						cursor="pointer"
						borderWidth="2px"
						borderColor={value === color ? "border.emphasized" : "transparent"}
						onClick={() => onChange(color)}
						_hover={{ transform: "scale(1.1)" }}
						transition="transform 0.1s"
					/>
				))}
			</Flex>
			{(showHexInput || showPreview) && (
				<HStack gap={2}>
					{showPreview && (
						<Box
							w={9}
							h={9}
							rounded="md"
							bg={value || "transparent"}
							borderWidth="1px"
							borderColor="border"
							flexShrink={0}
						/>
					)}
					{showHexInput && (
						<TextInput
							value={hexInput}
							onChange={(e) => setHexInput(e.target.value)}
							onBlur={handleHexSubmit}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleHexSubmit();
							}}
							placeholder="#000000"
							size="sm"
							maxW="120px"
						/>
					)}
				</HStack>
			)}
		</Stack>
	);
};
ColorSwatchPicker.displayName = "ColorSwatchPicker";
