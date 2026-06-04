import { ChevronDown } from "lucide-react";
import type React from "react";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "../../primitives/menu";
import { Button, type ButtonProps } from "../button";

export interface MenuButtonAction {
	/** Text shown on the single-action face and as the menu-item label. */
	label: string;
	onClick: () => void;
	/**
	 * Stable identity for the menu item, used as its key and Ark `value`.
	 * Defaults to `label`; set it explicitly when labels may collide.
	 */
	value?: string;
	/** Optional leading node (e.g. a status colour dot). */
	icon?: React.ReactNode;
	disabled?: boolean;
}

export interface MenuButtonProps
	extends Pick<
		ButtonProps,
		"variant" | "size" | "colorPalette" | "loading" | "disabled"
	> {
	/** The actions this control can perform. */
	actions: MenuButtonAction[];
	/**
	 * Trigger face text when there are 2+ actions, e.g. "Move to…".
	 * Ignored for the empty and single-action cases.
	 */
	menuLabel: string;
	/** Rendered when `actions` is empty. Defaults to nothing. */
	emptyLabel?: React.ReactNode;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
	actions,
	menuLabel,
	emptyLabel,
	...buttonProps
}) => {
	if (actions.length === 0) {
		return <>{emptyLabel ?? null}</>;
	}

	if (actions.length === 1) {
		const [action] = actions;
		return (
			<Button
				{...buttonProps}
				disabled={buttonProps.disabled || action.disabled}
				onClick={action.onClick}
			>
				{action.icon}
				{action.label}
			</Button>
		);
	}

	return (
		<MenuRoot>
			<MenuTrigger asChild>
				<Button {...buttonProps}>
					{menuLabel}
					<ChevronDown size={16} />
				</Button>
			</MenuTrigger>
			<MenuContent>
				{actions.map((action) => (
					<MenuItem
						key={action.value ?? action.label}
						value={action.value ?? action.label}
						onClick={action.onClick}
						disabled={action.disabled}
					>
						{action.icon}
						{action.label}
					</MenuItem>
				))}
			</MenuContent>
		</MenuRoot>
	);
};
MenuButton.displayName = "MenuButton";
