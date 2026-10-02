import { CircleDashed, type LucideIcon, type LucideProps } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { getLoadedIcon, loadIcon } from "./lucide-icons";

export interface DynamicIconProps extends Omit<LucideProps, "ref" | "name"> {
	/**
	 * A stored lucide name (`"file-text"`). A name lucide has since renamed
	 * (`"alert-triangle"`) still renders, as its successor.
	 */
	name: string | null | undefined;
	/**
	 * Rendered for an empty or unknown name. Defaults to a dashed circle with
	 * the same size and stroke, so a row holding a stale name keeps its shape.
	 */
	fallback?: ReactNode;
}

/**
 * Renders an icon from its stored lucide name. Each icon is its own lazily
 * imported chunk, loaded once and shared by every `DynamicIcon` on the page;
 * until it arrives the icon's box is held empty so rows don't shift.
 *
 * Decorative by default (`aria-hidden`). Pass `aria-label` when the icon
 * carries meaning on its own and it becomes `role="img"`.
 */
export const DynamicIcon = ({
	name,
	fallback,
	size = 24,
	...props
}: DynamicIconProps) => {
	const key = name?.trim() ?? "";
	const [, setLoaded] = useState(0);
	const icon: LucideIcon | null | undefined = key ? getLoadedIcon(key) : null;

	useEffect(() => {
		if (!key || getLoadedIcon(key) !== undefined) return;
		let live = true;
		loadIcon(key).then(() => {
			// The module cache now holds the answer; re-render to read it.
			if (live) setLoaded((n) => n + 1);
		});
		return () => {
			live = false;
		};
	}, [key]);

	const labelled = Boolean(props["aria-label"]);
	const a11y = labelled
		? { role: "img" as const }
		: { "aria-hidden": true as const };

	if (icon) {
		const Icon = icon;
		return <Icon size={size} {...a11y} {...props} data-state="loaded" />;
	}
	if (icon === null || !key) {
		if (fallback !== undefined) return <>{fallback}</>;
		return (
			<CircleDashed
				size={size}
				{...a11y}
				{...props}
				data-icon={key || undefined}
				data-state="fallback"
			/>
		);
	}
	// Loading: an empty box the icon's size, so nothing moves when it lands.
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			className={props.className}
			style={props.style}
			aria-hidden="true"
			data-icon={key}
			data-state="loading"
		/>
	);
};
DynamicIcon.displayName = "DynamicIcon";
