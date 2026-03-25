import {
	Badge,
	type BadgeProps,
	Stat as ChakraStat,
	FormatNumber,
} from "@chakra-ui/react";
import type * as React from "react";
import { InfoTip } from "./toggle-tip";

export interface StatLabelProps extends ChakraStat.LabelProps {
	info?: React.ReactNode;
}

export const StatLabel = function StatLabel({
	ref,
	...props
}: StatLabelProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { info, children, ...rest } = props;
	return (
		<ChakraStat.Label {...rest} ref={ref}>
			{children}
			{info && <InfoTip>{info}</InfoTip>}
		</ChakraStat.Label>
	);
};
StatLabel.displayName = "StatLabel";

export interface StatValueTextProps extends ChakraStat.ValueTextProps {
	value?: number;
	formatOptions?: Intl.NumberFormatOptions;
}

export const StatValueText = function StatValueText({
	ref,
	...props
}: StatValueTextProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { value, formatOptions, children, ...rest } = props;
	return (
		<ChakraStat.ValueText {...rest} ref={ref}>
			{children ||
				(value != null && <FormatNumber value={value} {...formatOptions} />)}
		</ChakraStat.ValueText>
	);
};
StatValueText.displayName = "StatValueText";

export const StatUpTrend = function StatUpTrend({
	ref,
	...props
}: BadgeProps & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<Badge colorPalette="green" gap="0" {...props} ref={ref}>
			<ChakraStat.UpIndicator />
			{props.children}
		</Badge>
	);
};
StatUpTrend.displayName = "StatUpTrend";

export const StatDownTrend = function StatDownTrend({
	ref,
	...props
}: BadgeProps & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<Badge colorPalette="red" gap="0" {...props} ref={ref}>
			<ChakraStat.DownIndicator />
			{props.children}
		</Badge>
	);
};
StatDownTrend.displayName = "StatDownTrend";

export const StatRoot = ChakraStat.Root;
StatRoot.displayName = "StatRoot";
export const StatHelpText = ChakraStat.HelpText;
StatHelpText.displayName = "StatHelpText";
export const StatValueUnit = ChakraStat.ValueUnit;
StatValueUnit.displayName = "StatValueUnit";
