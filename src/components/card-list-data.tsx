import { Tooltip } from "../primitives/tooltip";
import { Text, type TextProps } from "../primitives/typography";

export interface CardListDataProps extends TextProps {
	/** Cell content. Strings are shown in a tooltip on overflow. */
	children: React.ReactNode;
}

export const CardListData: React.FC<CardListDataProps> = ({
	children,
	...restProps
}) => {
	const textContent =
		typeof children === "string" || typeof children === "number"
			? String(children)
			: null;

	return (
		<Tooltip content={textContent ?? ""} disabled={!textContent}>
			<Text lineClamp={1} color="muted" {...restProps}>
				{children}
			</Text>
		</Tooltip>
	);
};
CardListData.displayName = "CardListData";
