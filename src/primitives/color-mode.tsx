import type { IconButtonProps, SpanProps } from "@chakra-ui/react";
import { ClientOnly, IconButton, Skeleton, Span } from "@chakra-ui/react";
import { Moon, Sun } from "lucide-react";
import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider, useTheme } from "next-themes";
import type * as React from "react";

export interface ColorModeProviderProps extends ThemeProviderProps {}

export function ColorModeProvider(props: ColorModeProviderProps) {
	return (
		<ThemeProvider attribute="class" disableTransitionOnChange {...props} />
	);
}
ColorModeProvider.displayName = "ColorModeProvider";

export type ColorMode = "light" | "dark";

export interface UseColorModeReturn {
	colorMode: ColorMode;
	setColorMode: (colorMode: ColorMode) => void;
	toggleColorMode: () => void;
}

export function useColorMode(): UseColorModeReturn {
	const { resolvedTheme, setTheme, forcedTheme } = useTheme();
	const colorMode = forcedTheme || resolvedTheme;
	const toggleColorMode = () => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	};
	return {
		colorMode: colorMode as ColorMode,
		setColorMode: setTheme,
		toggleColorMode,
	};
}

export function useColorModeValue<T>(light: T, dark: T) {
	const { colorMode } = useColorMode();
	return colorMode === "dark" ? dark : light;
}

export function ColorModeIcon() {
	const { colorMode } = useColorMode();
	return colorMode === "dark" ? <Moon /> : <Sun />;
}
ColorModeIcon.displayName = "ColorModeIcon";

interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {
	/** Accessible label for the color mode toggle button. @default "Toggle color mode" */
	label?: string;
}

export const ColorModeButton = function ColorModeButton({
	ref,
	label = "Toggle color mode",
	...props
}: ColorModeButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
	const { toggleColorMode } = useColorMode();
	return (
		<ClientOnly fallback={<Skeleton boxSize="9" />}>
			<IconButton
				onClick={toggleColorMode}
				variant="ghost"
				aria-label={label}
				size="sm"
				ref={ref}
				{...props}
				css={{
					_icon: {
						width: "5",
						height: "5",
					},
				}}
			>
				<ColorModeIcon />
			</IconButton>
		</ClientOnly>
	);
};
ColorModeButton.displayName = "ColorModeButton";

export const LightMode = function LightMode({
	ref,
	...props
}: SpanProps & { ref?: React.Ref<HTMLSpanElement> }) {
	return (
		<Span
			color="fg"
			display="contents"
			className="chakra-theme light"
			colorPalette="gray"
			data-theme="light"
			ref={ref}
			{...props}
		/>
	);
};
LightMode.displayName = "LightMode";

export const DarkMode = function DarkMode({
	ref,
	...props
}: SpanProps & { ref?: React.Ref<HTMLSpanElement> }) {
	return (
		<Span
			color="fg"
			display="contents"
			className="chakra-theme dark"
			colorPalette="gray"
			data-theme="dark"
			ref={ref}
			{...props}
		/>
	);
};
DarkMode.displayName = "DarkMode";
