import { ChevronDown } from "lucide-react";
import type React from "react";
import { HStack } from "../../primitives/layout";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "../../primitives/menu";
import { Button } from "../button";
import {
	resolveHalfProps,
	type SplitButtonStyleProps,
} from "./resolve-half-props";

export interface SplitButtonMenuItem {
	/** Menu item text. */
	label: string;
	onClick: () => void;
	/**
	 * Stable identity for the menu item, used as its key and Ark `value`.
	 * Defaults to `label`; set it explicitly when labels may collide.
	 */
	value?: string;
	/** Optional leading node (e.g. an icon or a status colour dot). */
	icon?: React.ReactNode;
	disabled?: boolean;
	/** Renders the item in the `error` token — deletes and the like. */
	destructive?: boolean;
}

export interface SplitButtonProps extends SplitButtonStyleProps {
	/** Text on the half that runs the default action. */
	label: string;
	/** The default action. */
	onClick: () => void;
	/** Alternatives to the default action, offered behind the chevron. */
	menuItems: SplitButtonMenuItem[];
	/**
	 * Accessible name for the chevron half, e.g. "Choose a task type". Required
	 * because that half is icon-only; name the choice it offers, not the icon.
	 */
	menuAriaLabel: string;
	/** Leading icon on the action half. None unless you pass one. */
	icon?: React.ReactNode;
}

/**
 * A default action paired with a menu of alternatives to it.
 *
 * Both halves are always present — that pairing is what makes it a split
 * button. For one face over a list of actions use `MenuButton`; for a single
 * action use `Button`.
 */
export const SplitButton: React.FC<SplitButtonProps> = ({
	label,
	menuItems,
	icon,
	...halfInput
}) => {
	const { action, trigger } = resolveHalfProps(halfInput);

	return (
		<HStack gap={0.5}>
			<Button {...action}>
				{icon}
				{label}
			</Button>
			<MenuRoot>
				<MenuTrigger asChild>
					<Button {...trigger}>
						<ChevronDown size={16} />
					</Button>
				</MenuTrigger>
				<MenuContent>
					{menuItems.map((menuItem) => (
						<MenuItem
							key={menuItem.value ?? menuItem.label}
							value={menuItem.value ?? menuItem.label}
							onClick={menuItem.onClick}
							disabled={menuItem.disabled}
							color={menuItem.destructive ? "error" : undefined}
						>
							{menuItem.icon}
							{menuItem.label}
						</MenuItem>
					))}
				</MenuContent>
			</MenuRoot>
		</HStack>
	);
};
SplitButton.displayName = "SplitButton";
