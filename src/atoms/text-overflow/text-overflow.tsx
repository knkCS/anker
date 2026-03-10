import { Text, type TextProps } from "@chakra-ui/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Tooltip } from "../../primitives/tooltip";

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
