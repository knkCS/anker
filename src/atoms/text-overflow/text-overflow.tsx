import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Tooltip } from "../../primitives/tooltip";
import { Text, type TextProps } from "../../primitives/typography";

export interface TextOverflowProps extends TextProps {}

export const TextOverflow: React.FC<TextOverflowProps> = memo((props) => {
	const { children, ...rest } = props;
	const textElementRef = useRef<HTMLDivElement>(null);
	const [isOverflown, setIsOverflown] = useState(false);

	const compareSize = useCallback(() => {
		const element = textElementRef.current;

		const compare = element
			? element.scrollWidth > element.clientWidth ||
				element.offsetWidth < element.scrollWidth ||
				element.offsetHeight < element.scrollHeight
			: false;

		setIsOverflown(compare);
	}, []);

	useEffect(() => {
		compareSize();
		const element = textElementRef.current;
		if (!element) return;
		const observer = new ResizeObserver(compareSize);
		observer.observe(element);
		return () => {
			observer.disconnect();
		};
	}, [compareSize]);

	return (
		<Tooltip content={children} disabled={!isOverflown}>
			<Text
				as="div"
				position="relative"
				whiteSpace={isOverflown ? "nowrap" : "normal"}
				{...rest}
				ref={textElementRef}
			>
				{children}
			</Text>
		</Tooltip>
	);
});

TextOverflow.displayName = "TextOverflow";
