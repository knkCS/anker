import { Alert as ChakraAlert } from "@chakra-ui/react";
import type * as React from "react";

export interface AlertProps extends Omit<ChakraAlert.RootProps, "title"> {
	startElement?: React.ReactNode;
	endElement?: React.ReactNode;
	title?: React.ReactNode;
	icon?: React.ReactElement;
}

export const Alert = function Alert({
	ref,
	...props
}: AlertProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { title, children, icon, startElement, endElement, ...rest } = props;
	return (
		<ChakraAlert.Root ref={ref} {...rest}>
			{startElement || <ChakraAlert.Indicator>{icon}</ChakraAlert.Indicator>}
			{children ? (
				<ChakraAlert.Content>
					<ChakraAlert.Title>{title}</ChakraAlert.Title>
					<ChakraAlert.Description>{children}</ChakraAlert.Description>
				</ChakraAlert.Content>
			) : (
				<ChakraAlert.Title flex="1">{title}</ChakraAlert.Title>
			)}
			{endElement}
		</ChakraAlert.Root>
	);
};
Alert.displayName = "Alert";
