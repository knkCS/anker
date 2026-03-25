import type React from "react";
import { Switch } from "../../../primitives/switch";

export interface SwitchCellProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	colorPalette?: string;
	/** Accessible label for screen readers. */
	label?: string;
}

export const SwitchCell: React.FC<SwitchCellProps> = ({
	checked,
	onChange,
	disabled,
	colorPalette = "green",
	label,
}) => {
	return (
		<Switch
			checked={checked}
			onCheckedChange={(details) => onChange(!!details.checked)}
			disabled={disabled}
			colorPalette={colorPalette}
			aria-label={label}
			onClick={(e: React.MouseEvent) => e.stopPropagation()}
		/>
	);
};
SwitchCell.displayName = "SwitchCell";
