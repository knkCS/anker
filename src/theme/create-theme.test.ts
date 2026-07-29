import { describe, expect, it } from "vitest";
import { createAnkerTheme } from "./create-theme";

/**
 * Registration pins for anker#153: Chakra v3's Input is SINGLE-PART and
 * resolves the plain `recipes.input` (InputAddon resolves
 * `recipes.inputAddon`). A v2-style registration under `slotRecipes.input`
 * is silently dead — Chakra's default (`outline` bg: "transparent")
 * applies and every text input renders transparent. These tests read the
 * COMPOSED system the way Chakra's components do (`getRecipe`), so a
 * regression to the dead registration fails them immediately.
 */
describe("createAnkerTheme recipe registration (#153)", () => {
	const system = createAnkerTheme();

	it("resolves the PLAIN input recipe with anker's outline bg", () => {
		const input = system.getRecipe("input");
		expect(input).toBeDefined();
		// Chakra's v3 default is bg: "transparent" — seeing it here means
		// anker's input styles are registered somewhere v3 never reads.
		expect(input.variants?.variant?.outline?.bg).toEqual({
			base: "white",
			_dark: "gray.800",
		});
	});

	it("resolves inputAddon with anker's addon styles", () => {
		const addon = system.getRecipe("inputAddon");
		expect(addon?.variants?.variant?.outline?.bg).toEqual({
			base: "gray.50",
			_dark: "gray.700",
		});
	});

	it("registers NO slot recipe under 'input' (v3 has none; one appearing is a dead v2 registration)", () => {
		expect(system.getSlotRecipe("input", null)).toBeNull();
	});

	it("control: textarea (the known-good plain-recipe sibling) resolves the same way", () => {
		expect(
			system.getRecipe("textarea")?.variants?.variant?.outline?.bg,
		).toEqual({
			base: "white",
			_dark: "gray.800",
		});
	});

	it("dialog backdrop carries the frosted-glass blur (ported from the dead modal recipe)", () => {
		const dialog = system.getSlotRecipe("dialog", null);
		expect(dialog?.base?.backdrop?.backdropFilter).toBe("blur(4px)");
	});

	it("resolves the PLAIN avatarPresence recipe with both states (#163)", () => {
		// Avatar reads this key by hand via `useRecipe`, so a stray move to
		// `slotRecipes` would leave the dot unstyled rather than erroring.
		const avatarPresence = system.getRecipe("avatarPresence");
		expect(avatarPresence?.variants?.presence?.online?.bg).toBe("success");
		expect(avatarPresence?.variants?.presence?.offline?.boxShadow).toBe(
			"inset 0 0 0 0.17em {colors.subtle}",
		);
	});

	it("gives avatarPresence no default variant — absent is not offline (#163)", () => {
		// A resting default would make `useRecipe({ key: "avatarPresence" })()`
		// resolve to a rendered offline dot, which is exactly the state the API
		// keeps distinct from "no presence to report".
		expect(system.getRecipe("avatarPresence")?.defaultVariants).toBeUndefined();
	});

	it("registers NO slot recipe under 'avatarPresence' (it is single-part)", () => {
		expect(system.getSlotRecipe("avatarPresence", null)).toBeNull();
	});

	it("leaves Chakra's own `avatar` recipe alone (the dot is a separate key)", () => {
		// The presence dot deliberately does not extend the avatar slot recipe:
		// its slots come from `avatarAnatomy`, so an anker-only slot would have
		// no Chakra component rendering it.
		expect(system.getSlotRecipe("avatar", null)?.slots).not.toContain(
			"presence",
		);
	});

	it("resolves the PLAIN unreadBadge recipe with both count states (#161)", () => {
		// UnreadBadge reads this key by hand via `useRecipe`, so a stray move to
		// `slotRecipes` would leave the pill unstyled rather than erroring.
		const unreadBadge = system.getRecipe("unreadBadge");
		expect(unreadBadge?.base?.bg).toBe("gray.solid");
		expect(unreadBadge?.variants?.mention?.true?.bg).toBe("primary.solid");
	});

	it("registers NO slot recipe under 'unreadBadge' (it is single-part)", () => {
		expect(system.getSlotRecipe("unreadBadge", null)).toBeNull();
	});

	it("resolves the typingIndicator SLOT recipe with all four slots (#162)", () => {
		// TypingIndicator reads this key by hand via `useSlotRecipe`; a stray
		// move to `recipes` would leave every slot unstyled rather than erroring.
		const typingIndicator = system.getSlotRecipe("typingIndicator", null);
		expect(typingIndicator?.slots).toEqual(["root", "dots", "dot", "label"]);
		expect(typingIndicator?.base?.dot?.bg).toBe("currentColor");
	});

	it("registers the typingBounce keyframe the dot recipe animates against", () => {
		// The recipe names a keyframe; globalCss defines it. A name that no
		// @keyframes block backs animates nothing, silently.
		const globalCss = system._config.globalCss as Record<string, unknown>;
		expect(globalCss["@keyframes typingBounce"]).toBeDefined();
		expect(
			system.getSlotRecipe("typingIndicator", null)?.base?.dot?.animation,
		).toContain("typingBounce");
	});

	it("resolves the reactionChips SLOT recipe with all four slots (#164)", () => {
		// ReactionChips reads this key by hand via `useSlotRecipe`; a stray move
		// to `recipes` would leave every slot unstyled rather than erroring.
		const reactionChips = system.getSlotRecipe("reactionChips", null);
		expect(reactionChips?.slots).toEqual(["root", "chip", "emoji", "count"]);
		expect(reactionChips?.base?.chip?.bg).toBe("bg-surface");
	});

	it("keeps the reacted chip on primary.subtle, not the inverted accent surface (#164)", () => {
		// bg-accent-subtle is an inverted accent surface and would swallow the
		// chip's own text — the same rule message self-bubbles and selected
		// conversation rows follow.
		const reacted = system.getSlotRecipe("reactionChips", null)?.variants
			?.reacted?.true;
		expect(reacted?.chip?.bg).toBe("primary.subtle");
		// The second, non-colour signal for the same state (WCAG 1.4.1).
		expect(reacted?.count?.fontWeight).toBe("bold");
	});

	it("gives the inert reactions readout back everything only a control should have (#164)", () => {
		// The `+N` chip without an onShowAll is a readout, not a button. It
		// keeps the chip's shape so the row stays even, so the variant is what
		// removes the pointer cursor, the hover tint and the 44px hit pseudo.
		const inert = system.getSlotRecipe("reactionChips", null)?.variants?.inert
			?.true;
		expect(inert?.chip?.cursor).toBe("default");
		expect(inert?.chip?._after?.content).toBe("none");
	});

	it("focuses reaction chips and quick-set options with the focus-ring SHADOW token (#164)", () => {
		// `focus-ring` is a shadow, not a colour: as `outlineColor` it resolves
		// to the literal string and the declaration is dropped entirely.
		const chip = system.getSlotRecipe("reactionChips", null)?.base?.chip;
		const option = system.getSlotRecipe("reactionQuickSet", null)?.base?.option;
		for (const slot of [chip, option]) {
			expect(slot?._focusVisible?.boxShadow).toBe("focus-ring");
			expect(slot?._focusVisible?.outlineColor).toBeUndefined();
		}
	});

	it("resolves the reactionQuickSet SLOT recipe with both slots at the 44px target (#164)", () => {
		const quickSet = system.getSlotRecipe("reactionQuickSet", null);
		expect(quickSet?.slots).toEqual(["grid", "option"]);
		expect(quickSet?.base?.option?.minWidth).toBe("44px");
		expect(quickSet?.base?.option?.minHeight).toBe("44px");
	});

	it("registers NO plain recipe under either reactions key (both are multi-part)", () => {
		// The mirror of the unreadBadge/avatarPresence pins: a v3 slot recipe
		// misfiled under `recipes` is just as silently dead as the reverse.
		expect(system.getRecipe("reactionChips")).toBeUndefined();
		expect(system.getRecipe("reactionQuickSet")).toBeUndefined();
	});

	it("resolves the message SLOT recipe with all nine slots (#157)", () => {
		// MessageGroup/MessageBubble read this key by hand via `useSlotRecipe`;
		// a dropped registration leaves every bubble unstyled rather than
		// erroring — the whole chat surface would ship as bare text.
		const message = system.getSlotRecipe("message", null);
		expect(message?.slots).toEqual([
			"group",
			"header",
			"avatar",
			"content",
			"bubbleRow",
			"bubble",
			"timestamp",
			"toolbar",
			"tombstone",
		]);
		expect(message?.base?.group?.display).toBe("flex");
	});

	it("keeps the self bubble on primary.subtle, not the inverted accent surface (#157)", () => {
		// The same rule reacted chips and selected conversation rows follow:
		// bg-accent-subtle is an inverted surface and would swallow the opaque
		// segment content the bubble renders untouched.
		const variants = system.getSlotRecipe("message", null)?.variants;
		expect(variants?.variant?.self?.bubble?.bg).toBe("primary.subtle");
		expect(variants?.variant?.other?.bubble?.bg).toBe("bg-surface");
	});

	it("resolves the messageList SLOT recipe with all seven slots (#158)", () => {
		// VirtualizedMessageList reads this key by hand via `useSlotRecipe`. The
		// viewport's scroll styles come from the recipe, so a dropped
		// registration silently turns off scrolling — not just the paint.
		const messageList = system.getSlotRecipe("messageList", null);
		expect(messageList?.slots).toEqual([
			"root",
			"viewport",
			"inner",
			"item",
			"divider",
			"dividerLabel",
			"jump",
		]);
		expect(messageList?.base?.viewport?.overflowY).toBe("auto");
		// Virtual rows are absolutely positioned against `inner` — without this
		// the whole history stacks in document flow.
		expect(messageList?.base?.item?.position).toBe("absolute");
	});

	it("resolves the composer SLOT recipe with all five slots (#159)", () => {
		// Composer reads this key by hand via `useSlotRecipe`; a dropped
		// registration leaves the input, the send button and the mention
		// dropdown unstyled rather than erroring.
		const composer = system.getSlotRecipe("composer", null);
		expect(composer?.slots).toEqual([
			"root",
			"textarea",
			"send",
			"dropdown",
			"option",
		]);
		expect(composer?.base?.send?.bg).toBe("accent");
	});

	it("resolves the conversationListItem SLOT recipe with all nine slots (#160)", () => {
		// ConversationListItem reads this key by hand via `useSlotRecipe`; a
		// dropped registration would also drop the row's touch target, since the
		// 44px minimum lives in the recipe rather than on the element.
		const row = system.getSlotRecipe("conversationListItem", null);
		expect(row?.slots).toEqual([
			"root",
			"avatar",
			"content",
			"titleRow",
			"title",
			"timestamp",
			"previewRow",
			"preview",
			"badge",
		]);
		expect(row?.base?.root?.minHeight).toBe("44px");
		expect(row?.variants?.selected?.true?.root?.bg).toBe("primary.subtle");
	});

	it("registers NO plain recipe under any of the four chat slot keys", () => {
		// The mirror of the reactions pin, for the four largest chat recipes: a
		// v3 slot recipe misfiled under `recipes` is just as silently dead.
		for (const key of [
			"message",
			"messageList",
			"composer",
			"conversationListItem",
		]) {
			expect(system.getRecipe(key)).toBeUndefined();
		}
	});
});
