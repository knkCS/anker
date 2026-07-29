import { chakra, useSlotRecipe } from "@chakra-ui/react";
import { SmilePlus } from "lucide-react";
import { IconButton } from "../../atoms/button";
import {
	Popover,
	PopoverBody,
	PopoverCloseTrigger,
	PopoverContent,
	PopoverTrigger,
} from "../../primitives/popover";
import { DEFAULT_REACTION_QUICK_SET } from "./quick-set";
import type { ReactionQuickSetPopoverProps } from "./types";

/**
 * The add-a-reaction sheet: a curated grid of emoji behind a trigger, closing
 * itself once one is picked. Presentation-only — options in, an emoji out of
 * `onSelect`.
 *
 * Deliberately not a searchable picker: that is v2, behind an optional subpath
 * (messengerhub ADR-0009), because a search index means an emoji-data
 * dependency in every consumer's bundle. Nothing here imports one.
 */
export const ReactionQuickSetPopover = ({
	onSelect,
	options = DEFAULT_REACTION_QUICK_SET,
	trigger,
	label = "Add reaction",
	open,
	onOpenChange,
	disabled = false,
}: ReactionQuickSetPopoverProps) => {
	const recipe = useSlotRecipe({ key: "reactionQuickSet" });
	const styles = recipe();

	return (
		<Popover
			open={open}
			onOpenChange={
				onOpenChange ? (details) => onOpenChange(details.open) : undefined
			}
			// Reactions hang off a message near the bottom of a scrolling
			// history, so the sheet opens upward for the same reason the
			// composer's mention dropdown does.
			positioning={{ placement: "top-start" }}
			// The grid is built only once the sheet is opened and torn down
			// again on close — the CLAUDE-ANKER mount rule, and it earns its
			// keep here: one of these hangs off every message in the history,
			// so mounting eagerly would put sixteen hidden buttons in the DOM
			// per message.
			lazyMount
			unmountOnExit
		>
			<PopoverTrigger asChild>
				{trigger ?? (
					<IconButton
						aria-label={label}
						variant="ghost"
						size="sm"
						disabled={disabled}
					>
						<SmilePlus size={16} aria-hidden="true" />
					</IconButton>
				)}
			</PopoverTrigger>
			<PopoverContent width="auto">
				<PopoverBody>
					<chakra.div
						css={styles.grid}
						className="reaction-quick-set"
						data-testid="reaction-quick-set"
						role="group"
						aria-label={label}
					>
						{options.map((option) => (
							// Closing on pick is the popover's own job — leaving the
							// sheet open would have every call site close it by hand.
							<PopoverCloseTrigger asChild key={option.emoji}>
								<chakra.button
									type="button"
									css={styles.option}
									className="reaction-quick-set__option"
									data-testid="reaction-quick-set-option"
									data-emoji={option.emoji}
									aria-label={option.label}
									onClick={() => onSelect(option.emoji)}
								>
									<chakra.span aria-hidden="true">{option.emoji}</chakra.span>
								</chakra.button>
							</PopoverCloseTrigger>
						))}
					</chakra.div>
				</PopoverBody>
			</PopoverContent>
		</Popover>
	);
};
ReactionQuickSetPopover.displayName = "ReactionQuickSetPopover";
