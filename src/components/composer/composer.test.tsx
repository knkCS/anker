// src/components/composer/composer.test.tsx
import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { createAnkerTheme } from "../../theme/create-theme";
import { Composer } from "./composer";
import type { ComposerMentionConfig } from "./types";

// The anker system is required (not defaultSystem): the `composer` slot
// recipe only exists in anker's theme, and the recipe-consumption test
// asserts that its styles actually land in the DOM.
const system = createAnkerTheme();
function renderWithAnkerTheme(ui: ReactElement) {
	return render(<ChakraProvider value={system}>{ui}</ChakraProvider>);
}

const textarea = () => screen.getByRole("textbox", { name: "Message" });
const sendButton = () => screen.getByRole("button", { name: "Send message" });

/** Types into the textarea like a user: sets the value, caret at the end. */
function type(value: string) {
	fireEvent.change(textarea(), {
		target: { value, selectionStart: value.length, selectionEnd: value.length },
	});
}

describe("Composer", () => {
	it("renders the textarea with placeholder and the labeled send button", () => {
		renderWithAnkerTheme(<Composer />);
		expect(textarea()).toHaveAttribute("placeholder", "Write a message…");
		expect(sendButton()).toBeInTheDocument();
	});

	it("consumes the registered `composer` slot recipe (guard against dead recipes)", () => {
		renderWithAnkerTheme(<Composer />);
		const root = screen.getByTestId("composer");
		const cssClass = Array.from(root.classList).find((c) =>
			c.startsWith("css-"),
		);
		expect(cssClass).toBeDefined();
		const css = Array.from(document.querySelectorAll("style"))
			.map((s) => s.textContent ?? "")
			.join("\n");
		const ruleText = css.split(`.${cssClass}`).slice(1).join("\n");
		expect(ruleText).toContain("var(--chakra-colors-bg-surface)");
	});

	it("reports input changes via onValueChange and onInputActivity", () => {
		const onValueChange = vi.fn();
		const onInputActivity = vi.fn();
		renderWithAnkerTheme(
			<Composer
				onValueChange={onValueChange}
				onInputActivity={onInputActivity}
			/>,
		);
		type("hej");
		expect(onValueChange).toHaveBeenCalledWith("hej");
		expect(onInputActivity).toHaveBeenCalledTimes(1);
	});

	it("disables the send button while the value is blank", () => {
		renderWithAnkerTheme(<Composer />);
		expect(sendButton()).toBeDisabled();
		type("   ");
		expect(sendButton()).toBeDisabled();
		type("hello");
		expect(sendButton()).toBeEnabled();
	});

	it("submits on Enter and clears an uncontrolled composer", () => {
		const onSubmit = vi.fn();
		renderWithAnkerTheme(<Composer onSubmit={onSubmit} />);
		type("ship it");
		fireEvent.keyDown(textarea(), { key: "Enter" });
		expect(onSubmit).toHaveBeenCalledWith("ship it");
		expect(textarea()).toHaveValue("");
	});

	it("inserts a newline instead of submitting on Shift+Enter", () => {
		const onSubmit = vi.fn();
		renderWithAnkerTheme(<Composer onSubmit={onSubmit} />);
		type("line one");
		fireEvent.keyDown(textarea(), { key: "Enter", shiftKey: true });
		expect(onSubmit).not.toHaveBeenCalled();
		expect(textarea()).toHaveValue("line one");
	});

	it("does not submit on Enter when submitOnEnter is false", () => {
		const onSubmit = vi.fn();
		renderWithAnkerTheme(
			<Composer onSubmit={onSubmit} submitOnEnter={false} />,
		);
		type("draft");
		fireEvent.keyDown(textarea(), { key: "Enter" });
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("never submits blank text", () => {
		const onSubmit = vi.fn();
		renderWithAnkerTheme(<Composer onSubmit={onSubmit} />);
		type("   ");
		fireEvent.keyDown(textarea(), { key: "Enter" });
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits via the send button", () => {
		const onSubmit = vi.fn();
		renderWithAnkerTheme(<Composer onSubmit={onSubmit} />);
		type("via button");
		fireEvent.click(sendButton());
		expect(onSubmit).toHaveBeenCalledWith("via button");
	});

	it("keeps a controlled value on submit — the consumer owns the reset", () => {
		const onSubmit = vi.fn();
		const onValueChange = vi.fn();
		renderWithAnkerTheme(
			<Composer
				value="controlled"
				onValueChange={onValueChange}
				onSubmit={onSubmit}
			/>,
		);
		fireEvent.keyDown(textarea(), { key: "Enter" });
		expect(onSubmit).toHaveBeenCalledWith("controlled");
		expect(textarea()).toHaveValue("controlled");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("disabled: textarea and send are disabled, root carries data-disabled", () => {
		renderWithAnkerTheme(<Composer disabled defaultValue="archived" />);
		expect(textarea()).toBeDisabled();
		expect(sendButton()).toBeDisabled();
		expect(screen.getByTestId("composer")).toHaveAttribute("data-disabled");
	});

	it("has displayName set", () => {
		expect((Composer as { displayName?: string }).displayName).toBe("Composer");
	});
});

interface Member {
	id: string;
	name: string;
}

const MEMBERS: Member[] = [
	{ id: "u1", name: "Ada Lovelace" },
	{ id: "u2", name: "Grace Hopper" },
	{ id: "u3", name: "Annie Easley" },
];

function makeMention(
	overrides: Partial<ComposerMentionConfig<Member>> = {},
): ComposerMentionConfig<Member> {
	return {
		getSuggestions: vi.fn((query: string) =>
			MEMBERS.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())),
		),
		getSuggestionKey: (m: Member) => m.id,
		renderSuggestion: (m: Member) => <span>{m.name}</span>,
		onSelect: vi.fn((m: Member) => `@${m.name} `),
		...overrides,
	};
}

const dropdown = () =>
	screen.getByRole("listbox", { name: "Mention suggestions" });
const options = () => screen.getAllByRole("option");

describe("Composer mention autocomplete", () => {
	it("opens on the trigger and renders suggestions from the injected callback", () => {
		const mention = makeMention();
		renderWithAnkerTheme(<Composer mention={mention} />);
		type("@ad");
		expect(mention.getSuggestions).toHaveBeenCalledWith("ad");
		expect(dropdown()).toBeInTheDocument();
		expect(options()).toHaveLength(1);
		expect(options()[0]).toHaveTextContent("Ada Lovelace");
	});

	it("stays closed for a trigger inside a word (emails)", () => {
		renderWithAnkerTheme(<Composer mention={makeMention()} />);
		type("mail ada@example");
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("closes when the callback returns no items", () => {
		renderWithAnkerTheme(<Composer mention={makeMention()} />);
		type("@zzz");
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("renders async suggestions when the injected callback resolves", async () => {
		const mention = makeMention({
			getSuggestions: vi.fn(async () => MEMBERS),
		});
		renderWithAnkerTheme(<Composer mention={mention} />);
		type("@a");
		expect(
			await screen.findByRole("listbox", { name: "Mention suggestions" }),
		).toBeInTheDocument();
		expect(options()).toHaveLength(3);
	});

	it("moves the highlight with arrow keys, wrapping, and mirrors it in ARIA", () => {
		renderWithAnkerTheme(<Composer mention={makeMention()} />);
		type("@a");
		expect(options()).toHaveLength(3);
		expect(options()[0]).toHaveAttribute("aria-selected", "true");
		fireEvent.keyDown(textarea(), { key: "ArrowDown" });
		expect(options()[1]).toHaveAttribute("aria-selected", "true");
		expect(textarea()).toHaveAttribute(
			"aria-activedescendant",
			options()[1].id,
		);
		fireEvent.keyDown(textarea(), { key: "ArrowUp" });
		fireEvent.keyDown(textarea(), { key: "ArrowUp" });
		expect(options()[2]).toHaveAttribute("aria-selected", "true");
	});

	it("Enter selects the highlighted suggestion instead of submitting", () => {
		const mention = makeMention();
		const onSubmit = vi.fn();
		renderWithAnkerTheme(<Composer mention={mention} onSubmit={onSubmit} />);
		type("hi @gra");
		fireEvent.keyDown(textarea(), { key: "Enter" });
		expect(mention.onSelect).toHaveBeenCalledWith(MEMBERS[1], {
			query: "gra",
			start: 3,
			end: 7,
		});
		expect(onSubmit).not.toHaveBeenCalled();
		expect(textarea()).toHaveValue("hi @Grace Hopper ");
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("clicking a suggestion selects it", () => {
		const mention = makeMention();
		renderWithAnkerTheme(<Composer mention={mention} />);
		type("@annie");
		fireEvent.click(options()[0]);
		expect(mention.onSelect).toHaveBeenCalledWith(MEMBERS[2], {
			query: "annie",
			start: 0,
			end: 6,
		});
		expect(textarea()).toHaveValue("@Annie Easley ");
	});

	it("leaves the input unchanged when onSelect returns nothing", () => {
		const mention = makeMention({ onSelect: vi.fn() });
		renderWithAnkerTheme(<Composer mention={mention} />);
		type("@ada");
		fireEvent.keyDown(textarea(), { key: "Enter" });
		expect(textarea()).toHaveValue("@ada");
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("drops a pending insertion caret when a controlled value never echoes it", () => {
		const { rerender } = renderWithAnkerTheme(
			<Composer value="hello @ada" mention={makeMention()} />,
		);
		// User keystroke the parent ignores — opens the dropdown ("ad" matches).
		fireEvent.change(textarea(), {
			target: { value: "hello @ad", selectionStart: 9, selectionEnd: 9 },
		});
		fireEvent.keyDown(textarea(), { key: "Enter" });
		// The insertion proposed caret 20 (after "hello @Ada Lovelace "), but
		// the parent kept its own value. When it later renders an unrelated
		// value, the stale caret must not be applied to it.
		rerender(
			<ChakraProvider value={system}>
				<Composer
					value="hello @ada, updated by parent"
					mention={makeMention()}
				/>
			</ChakraProvider>,
		);
		const el = textarea() as HTMLTextAreaElement;
		expect(el.selectionStart).not.toBe(20);
	});

	it("Escape dismisses the dropdown for the rest of that token; a fresh trigger reopens it", () => {
		renderWithAnkerTheme(<Composer mention={makeMention()} />);
		type("@a");
		expect(dropdown()).toBeInTheDocument();
		fireEvent.keyDown(textarea(), { key: "Escape" });
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		type("@ad");
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		type("");
		type("@g");
		expect(dropdown()).toBeInTheDocument();
	});

	it("wires the combobox ARIA contract on the textarea", () => {
		renderWithAnkerTheme(<Composer mention={makeMention()} />);
		expect(textarea()).toHaveAttribute("aria-autocomplete", "list");
		expect(textarea()).toHaveAttribute("aria-expanded", "false");
		type("@a");
		expect(textarea()).toHaveAttribute("aria-expanded", "true");
		expect(textarea()).toHaveAttribute("aria-controls", dropdown().id);
	});
});
