import {
	Avatar as ChakraAvatar,
	AvatarGroup as ChakraAvatarGroup,
} from "@chakra-ui/react";
import type * as React from "react";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

export interface AvatarProps extends ChakraAvatar.RootProps {
	/** Display name used to generate initials for the fallback. */
	name?: string;
	/** Image source URL. */
	src?: string;
	/** Image srcSet attribute for responsive images. */
	srcSet?: string;
	/** Image loading strategy. */
	loading?: ImageProps["loading"];
	/** Custom icon element shown as fallback. */
	icon?: React.ReactElement;
	/** Custom fallback content when no image or icon is provided. */
	fallback?: React.ReactNode;
}

export const Avatar = function Avatar({
	ref,
	...props
}: AvatarProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { name, src, srcSet, loading, icon, fallback, children, ...rest } =
		props;
	return (
		<ChakraAvatar.Root ref={ref} {...rest}>
			<ChakraAvatar.Fallback name={name}>
				{icon || fallback}
			</ChakraAvatar.Fallback>
			<ChakraAvatar.Image src={src} srcSet={srcSet} loading={loading} />
			{children}
		</ChakraAvatar.Root>
	);
};
Avatar.displayName = "Avatar";

export const AvatarGroup = ChakraAvatarGroup;
AvatarGroup.displayName = "AvatarGroup";
