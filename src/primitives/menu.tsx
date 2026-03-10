"use client";

import { AbsoluteCenter, Menu as ChakraMenu, Portal } from "@chakra-ui/react";
import { Check, ChevronRight } from "lucide-react";
import type * as React from "react";

interface MenuContentProps extends ChakraMenu.ContentProps {
	portalled?: boolean;
	portalRef?: React.RefObject<HTMLElement | null>;
}

export const MenuContent = function MenuContent({
	ref,
	...props
}: MenuContentProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { portalled = true, portalRef, ...rest } = props;
	return (
		<Portal disabled={!portalled} container={portalRef}>
			<ChakraMenu.Positioner>
				<ChakraMenu.Content ref={ref} {...rest} />
			</ChakraMenu.Positioner>
		</Portal>
	);
};

export const MenuArrow = function MenuArrow({
	ref,
	...props
}: ChakraMenu.ArrowProps & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<ChakraMenu.Arrow ref={ref} {...props}>
			<ChakraMenu.ArrowTip />
		</ChakraMenu.Arrow>
	);
};

export const MenuCheckboxItem = function MenuCheckboxItem({
	ref,
	...props
}: ChakraMenu.CheckboxItemProps & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<ChakraMenu.CheckboxItem ps="8" ref={ref} {...props}>
			<AbsoluteCenter axis="horizontal" insetStart="4" asChild>
				<ChakraMenu.ItemIndicator>
					<Check />
				</ChakraMenu.ItemIndicator>
			</AbsoluteCenter>
			{props.children}
		</ChakraMenu.CheckboxItem>
	);
};

export const MenuRadioItem = function MenuRadioItem({
	ref,
	...props
}: ChakraMenu.RadioItemProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { children, ...rest } = props;
	return (
		<ChakraMenu.RadioItem ps="8" ref={ref} {...rest}>
			<AbsoluteCenter axis="horizontal" insetStart="4" asChild>
				<ChakraMenu.ItemIndicator>
					<Check />
				</ChakraMenu.ItemIndicator>
			</AbsoluteCenter>
			<ChakraMenu.ItemText>{children}</ChakraMenu.ItemText>
		</ChakraMenu.RadioItem>
	);
};

export const MenuItemGroup = function MenuItemGroup({
	ref,
	...props
}: ChakraMenu.ItemGroupProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { title, children, ...rest } = props;
	return (
		<ChakraMenu.ItemGroup ref={ref} {...rest}>
			{title && (
				<ChakraMenu.ItemGroupLabel userSelect="none">
					{title}
				</ChakraMenu.ItemGroupLabel>
			)}
			{children}
		</ChakraMenu.ItemGroup>
	);
};

export interface MenuTriggerItemProps extends ChakraMenu.ItemProps {
	startIcon?: React.ReactNode;
}

export const MenuTriggerItem = function MenuTriggerItem({
	ref,
	...props
}: MenuTriggerItemProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { startIcon, children, ...rest } = props;
	return (
		<ChakraMenu.TriggerItem ref={ref} {...rest}>
			{startIcon}
			{children}
			<ChevronRight />
		</ChakraMenu.TriggerItem>
	);
};

export const MenuRadioItemGroup = ChakraMenu.RadioItemGroup;
export const MenuContextTrigger = ChakraMenu.ContextTrigger;
export const MenuRoot = ChakraMenu.Root;
export const MenuSeparator = ChakraMenu.Separator;

export const MenuItem = ChakraMenu.Item;
export const MenuItemText = ChakraMenu.ItemText;
export const MenuItemCommand = ChakraMenu.ItemCommand;
export const MenuTrigger = ChakraMenu.Trigger;
