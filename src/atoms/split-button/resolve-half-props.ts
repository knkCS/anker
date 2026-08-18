import type { ButtonProps } from "../button";

/**
 * The Button props a SplitButton forwards to both of its halves.
 *
 * Deliberately an explicit subset rather than all of `ButtonProps` (ADR-0001):
 * a prop this component cannot honour must not appear in its type. Notably
 * absent are `children` (the halves render their own), `asChild` (it would
 * replace the button element the menu trigger needs) and the border-radius
 * props (they carry the seam between the halves).
 */
export type SplitButtonStyleProps = Pick<
	ButtonProps,
	"variant" | "size" | "colorPalette" | "loading" | "disabled"
>;

export interface SplitButtonHalfInput extends SplitButtonStyleProps {
	/** The default action, run by the action half. */
	onClick: () => void;
	/** Accessible name for the icon-only chevron half. */
	menuAriaLabel: string;
}

export interface SplitButtonHalfProps {
	/** Props for the half that runs the default action. */
	action: ButtonProps;
	/** Props for the half that opens the menu. */
	trigger: ButtonProps;
}

/**
 * Splits a SplitButton's props into the two halves' Button props.
 *
 * This exists as a pure function because the regression it guards is otherwise
 * untestable: Chakra v3 emits nothing observable in the DOM for `size`,
 * `variant` or `colorPalette`, so "the consumer's value survived" has to be
 * asserted before render rather than after it.
 *
 * Two rules are load-bearing:
 *
 * 1. Forwarded props are spread FIRST and the structural props (seam radii,
 *    the trigger's accessible name) applied after, so a consumer value can
 *    never silently lose and can never break the seam.
 * 2. A prop the consumer did not pass stays absent — it is never forwarded as
 *    `undefined`. `Button` applies `size="md"` / `variant="secondary"` before
 *    its own spread, so an explicit `undefined` would clobber those and fall
 *    through to the recipe's `defaultVariants`, where `size` is `"lg"`.
 */
export function resolveHalfProps({
	onClick,
	menuAriaLabel,
	...styleProps
}: SplitButtonHalfInput): SplitButtonHalfProps {
	return {
		action: {
			...styleProps,
			onClick,
			borderEndRadius: "none",
		},
		trigger: {
			...styleProps,
			// A spinner on both halves would read as two pending actions, and this
			// one would replace the chevron. The trigger only reflects the wait.
			loading: false,
			disabled: styleProps.disabled === true || styleProps.loading === true,
			"aria-label": menuAriaLabel,
			borderStartRadius: "none",
		},
	};
}
