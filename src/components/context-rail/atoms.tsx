// src/components/context-rail/atoms.tsx
//
// Compact atoms for `<ContextRail>`. Each atom is mode-aware (reads the
// rail's `collapsed` state from `RailModeContext` via `useContextRailMode`)
// and renders an expanded form (full-width row/button) or a compact
// 32×32 form (icon + tooltip) accordingly. Each atom carries a
// `railAtom` static field so `<ContextRail.Section>` can filter children
// in collapsed mode.
import type React from "react";
import { Button, IconButton } from "../../atoms/button";
import { Box } from "../../primitives/layout";
import { Tooltip } from "../../primitives/tooltip";
import { Text } from "../../primitives/typography";
import { RAIL_ATOM, useContextRailMode } from "./context-rail-context";

type IconButtonTone =
    | "default"
    | "primary"
    | "outline-red"
    | "outline-primary"
    | "ghost";

export interface ContextRailIconButtonProps {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    tone?: IconButtonTone;
}

function buttonVariantFromTone(tone: IconButtonTone): {
    variant: "outline" | "solid" | "ghost";
    colorPalette?: string;
} {
    switch (tone) {
        case "primary":
            return { variant: "solid", colorPalette: "primary" };
        case "outline-red":
            return { variant: "outline", colorPalette: "red" };
        case "outline-primary":
            return { variant: "outline", colorPalette: "primary" };
        case "ghost":
            return { variant: "ghost" };
        default:
            return { variant: "outline" };
    }
}

export function ContextRailIconButton({
    label,
    icon,
    onClick,
    tone = "default",
}: ContextRailIconButtonProps) {
    const { collapsed } = useContextRailMode();
    const { variant, colorPalette } = buttonVariantFromTone(tone);

    if (collapsed) {
        return (
            <Tooltip content={label} positioning={{ placement: "left" }}>
                <IconButton
                    variant={variant}
                    colorPalette={colorPalette}
                    size="sm"
                    aria-label={label}
                    onClick={onClick}
                >
                    {icon}
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <Button
            variant={variant}
            colorPalette={colorPalette}
            size="sm"
            w="full"
            onClick={onClick}
        >
            {icon}
            {label}
        </Button>
    );
}
ContextRailIconButton.displayName = "ContextRail.IconButton";
(ContextRailIconButton as unknown as { railAtom: symbol }).railAtom = RAIL_ATOM;

export interface ContextRailValueTileProps {
    value: number | string;
    label: string;
    muted?: boolean;
    keepWhenEmpty?: boolean;
}

function isEmpty(value: number | string): boolean {
    if (value === 0) return true;
    if (value === "0" || value === "") return true;
    return false;
}

export function ContextRailValueTile({
    value,
    label,
    muted,
    keepWhenEmpty,
}: ContextRailValueTileProps) {
    const { collapsed } = useContextRailMode();
    const hideWhenEmpty = collapsed && isEmpty(value) && !keepWhenEmpty;

    if (hideWhenEmpty) return null;

    if (collapsed) {
        return (
            <Tooltip content={label} positioning={{ placement: "left" }}>
                <Box
                    w="8"
                    h="8"
                    borderRadius="md"
                    bg="bg-subtle"
                    borderWidth="1px"
                    borderColor="border"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                    color={muted ? "muted" : "default"}
                    aria-label={`${label}: ${value}`}
                >
                    {value}
                </Box>
            </Tooltip>
        );
    }

    return (
        <Box bg="bg-subtle" borderRadius="md" p="2" minW="0" flex="1">
            <Text fontSize="xs" color="muted" mb="1">
                {label}
            </Text>
            <Text fontSize="lg" fontWeight="semibold" color={muted ? "muted" : "default"}>
                {value}
            </Text>
        </Box>
    );
}
ContextRailValueTile.displayName = "ContextRail.ValueTile";
(ContextRailValueTile as unknown as { railAtom: symbol }).railAtom = RAIL_ATOM;
