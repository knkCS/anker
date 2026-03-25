import { chakra, type HTMLChakraProps, useRecipe } from "@chakra-ui/react";
import type React from "react";

export interface ProseProps extends HTMLChakraProps<"div"> {
	size?: "md" | "lg";
}

export const Prose = ({
	ref,
	size,
	...props
}: ProseProps & { ref?: React.Ref<HTMLDivElement> }) => {
	const recipe = useRecipe({ key: "prose" });
	const styles = recipe({ size });
	return <chakra.div ref={ref} css={styles} {...props} />;
};
Prose.displayName = "Prose";
