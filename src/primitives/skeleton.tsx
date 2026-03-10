import {
	Skeleton as ChakraSkeleton,
	type SkeletonProps as ChakraSkeletonProps,
	Circle,
	Stack,
} from "@chakra-ui/react";
import type React from "react";

export type SkeletonProps = ChakraSkeletonProps;

/** Rectangular skeleton placeholder. */
export const Skeleton: React.FC<SkeletonProps> = (props) => {
	return <ChakraSkeleton {...props} />;
};

export interface SkeletonTextProps {
	/** Number of text lines. @default 3 */
	lines?: number;
	/** Gap between lines. @default 3 */
	gap?: number | string;
}

/** Multi-line text skeleton placeholder. */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
	lines = 3,
	gap = 3,
}) => {
	return (
		<Stack gap={gap}>
			{Array.from({ length: lines }).map((_, i) => (
				<ChakraSkeleton
					key={i}
					height="3"
					width={i === lines - 1 ? "80%" : "100%"}
					borderRadius="sm"
				/>
			))}
		</Stack>
	);
};

/** Circular skeleton placeholder for avatars. */
export const SkeletonCircle: React.FC<{ size?: string | number }> = ({
	size = 10,
}) => {
	return (
		<Circle asChild size={size}>
			<ChakraSkeleton />
		</Circle>
	);
};
