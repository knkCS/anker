import {
	Avatar as ChakraAvatar,
	AvatarGroup as ChakraAvatarGroup,
	chakra,
	useRecipe,
} from "@chakra-ui/react";
import type * as React from "react";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

function defaultPresenceLabel(presence: AvatarPresence) {
	return presence === "online" ? "Online" : "Offline";
}

/** Binary presence state. Absent means the indicator is not rendered at all. */
export type AvatarPresence = "online" | "offline";

export interface AvatarProps extends ChakraAvatar.RootProps {
	/** Display name used to generate initials for the fallback. */
	name?: string;
	/**
	 * Renders the presence indicator — a dot anchored to the avatar's
	 * bottom-inline-end corner. Leave it unset for no indicator: absent means
	 * "no presence to show", which is a different thing from a known `"offline"`.
	 */
	presence?: AvatarPresence;
	/**
	 * Accessible name for the presence dot. Defaults to `"Online"` / `"Offline"`
	 * — pass a translated string to localise.
	 */
	presenceLabel?: string;
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
	const presenceRecipe = useRecipe({ key: "avatarPresence" });
	const {
		name,
		src,
		srcSet,
		loading,
		icon,
		fallback,
		presence,
		presenceLabel,
		children,
		...rest
	} = props;
	return (
		<ChakraAvatar.Root ref={ref} {...rest}>
			<ChakraAvatar.Fallback name={name}>
				{icon || fallback}
			</ChakraAvatar.Fallback>
			<ChakraAvatar.Image src={src} srcSet={srcSet} loading={loading} />
			{children}
			{presence ? (
				<chakra.span
					css={presenceRecipe({ presence })}
					className="avatar__presence"
					data-testid="avatar-presence"
					data-presence={presence}
					// role="img" makes the label the whole accessible name: an empty
					// dot says nothing on its own, and a bare span with aria-label is
					// not reliably exposed.
					role="img"
					aria-label={presenceLabel ?? defaultPresenceLabel(presence)}
				/>
			) : null}
		</ChakraAvatar.Root>
	);
};
Avatar.displayName = "Avatar";

export const AvatarGroup = ChakraAvatarGroup;
AvatarGroup.displayName = "AvatarGroup";
