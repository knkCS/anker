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
import { Tooltip } from "../../primitives/tooltip";
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
