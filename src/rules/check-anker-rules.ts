// src/rules/check-anker-rules.ts
//
// The mechanical half of anker's rules for packages that consume it
// (CLAUDE-ANKER.md). A package's own `anker-rules.test.ts` reads its sources
// and hands them here, so the checks track the installed anker version the
// way the imported CLAUDE-ANKER.md does — instead of each package carrying a
// hand-copied list that drifts.
//
// The checks read source text, not an AST: anker takes no parser dependency
// for this, and every rule here is decidable from one opening JSX tag or one
// import line. Rules that need judgement (which tab pads itself, which action
// belongs in the rail) stay prose in CLAUDE-ANKER.md.

/** One source file of the consuming package, path relative to its root. */
export interface AnkerRuleSource {
	file: string;
	text: string;
}

export type AnkerRuleId =
	| "no-raw-chakra"
	| "no-hex-colour"
	| "settings-template-needs-tabs"
	| "no-card-max-width"
	| "no-select-field";

export interface AnkerRuleViolation {
	rule: AnkerRuleId;
	file: string;
	/** 1-based line of the offending import, literal or opening tag. */
	line: number;
	message: string;
}

const MESSAGES: Record<AnkerRuleId, string> = {
	"no-raw-chakra":
		"Import anker's wrappers, not @chakra-ui directly — raw Chakra bypasses anker's defaults and drifts visually.",
	"no-hex-colour":
		"Use a semantic token, not a hex colour — hex does not follow the design system when it changes.",
	"settings-template-needs-tabs":
		"SettingsPageTemplate needs `tabs` (≥ 2 tabs); a page without tabs is a DetailPageTemplate.",
	"no-card-max-width":
		"No maxW on a Card — the template owns the body width, and a capped Card sits orphaned on a full-width page.",
	"no-select-field":
		"SelectField is deprecated — a select in a form is BaseSelectField, or LookupSelectField when the options come from a server. A native select is only for toolbar filters.",
};

/**
 * Check a package's sources against anker's mechanical rules. Returns every
 * violation, grouped by file in input order and by line within a file; an
 * empty array means the sources pass. Comments are ignored.
 */
export function checkAnkerRules(
	sources: readonly AnkerRuleSource[],
): AnkerRuleViolation[] {
	return sources.flatMap(({ file, text }) => {
		const code = blankComments(text);
		const found: { rule: AnkerRuleId; index: number }[] = [];

		for (const m of code.matchAll(
			/\b(?:from|import)\s*\(?\s*["']@chakra-ui\//g,
		)) {
			found.push({ rule: "no-raw-chakra", index: m.index });
		}
		for (const m of code.matchAll(
			/["'`]#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})["'`]/g,
		)) {
			found.push({ rule: "no-hex-colour", index: m.index });
		}
		for (const tag of openingTags(code, "SettingsPageTemplate")) {
			if (!tag.hasSpread && !tag.attributes.includes("tabs")) {
				found.push({ rule: "settings-template-needs-tabs", index: tag.index });
			}
		}
		for (const tag of openingTags(code, "Card")) {
			if (
				tag.attributes.includes("maxW") ||
				tag.attributes.includes("maxWidth")
			) {
				found.push({ rule: "no-card-max-width", index: tag.index });
			}
		}

		// Named imports (and re-exports) from any anker subpath. Each offending
		// name is reported on its own line, which in a multi-line import is not
		// the line the `import` keyword sits on.
		for (const m of code.matchAll(
			/\b(?:import|export)(?:\s+type)?\s*\{([^}]*)\}\s*from\s*["']@knkcs\/anker(?:\/[\w-]+)?["']/g,
		)) {
			const namesStart = m.index + m[0].indexOf("{") + 1;
			// Anchored to the start of a specifier, so only the imported name
			// counts: `BaseSelectField as SelectField` is the replacement.
			for (const name of m[1].matchAll(
				/(?:^|,)\s*(?:type\s+)?(SelectField(?:Props)?)(?![\w$])/g,
			)) {
				found.push({
					rule: "no-select-field",
					index: namesStart + name.index + name[0].indexOf(name[1]),
				});
			}
		}

		return found
			.sort((a, b) => a.index - b.index)
			.map(({ rule, index }) => ({
				rule,
				file,
				line: lineOf(code, index),
				message: MESSAGES[rule],
			}));
	});
}

function lineOf(text: string, index: number): number {
	let line = 1;
	for (let i = 0; i < index; i++) if (text[i] === "\n") line++;
	return line;
}

/**
 * Replace `//` and `/* *\/` comments with spaces, keeping newlines so indices
 * and line numbers survive. Quoted strings are skipped so a `//` inside one
 * stays; a quote never runs past its line, which bounds the damage an
 * apostrophe in JSX text can do to one line.
 */
function blankComments(text: string): string {
	const out = text.split("");
	let i = 0;
	while (i < text.length) {
		const c = text[i];
		const next = text[i + 1];
		if (c === "/" && next === "/") {
			while (i < text.length && text[i] !== "\n") out[i++] = " ";
		} else if (c === "/" && next === "*") {
			const end = text.indexOf("*/", i + 2);
			const stop = end === -1 ? text.length : end + 2;
			for (; i < stop; i++) if (text[i] !== "\n") out[i] = " ";
		} else if (c === '"' || c === "'" || c === "`") {
			i = skipString(text, i);
		} else {
			i++;
		}
	}
	return out.join("");
}

/** Index just past the string opened at `start`. */
function skipString(text: string, start: number): number {
	const quote = text[start];
	let i = start + 1;
	while (i < text.length) {
		const c = text[i];
		if (c === "\\") i += 2;
		else if (c === quote) return i + 1;
		else if (c === "\n" && quote !== "`") return i;
		else i++;
	}
	return i;
}

interface OpeningTag {
	index: number;
	/** Attribute names written on the tag itself, not inside expressions. */
	attributes: string[];
	/** A `{...spread}` can carry any prop, so presence checks must pass it. */
	hasSpread: boolean;
}

function openingTags(code: string, name: string): OpeningTag[] {
	const tags: OpeningTag[] = [];
	for (const m of code.matchAll(new RegExp(`<${name}(?=[\\s/>])`, "g"))) {
		let i = m.index + m[0].length;
		let depth = 0;
		let hasSpread = false;
		const own: string[] = [];
		while (i < code.length) {
			const c = code[i];
			if (depth === 0 && c === ">") break;
			if (c === '"' || c === "'" || c === "`") {
				const end = skipString(code, i);
				own.push(" ".repeat(end - i));
				i = end;
				continue;
			}
			if (c === "{") {
				if (depth === 0 && /^\{\s*\.\.\./.test(code.slice(i, i + 32))) {
					hasSpread = true;
				}
				depth++;
			} else if (c === "}") {
				depth = Math.max(0, depth - 1);
				own.push(" ");
				i++;
				continue;
			}
			own.push(depth === 0 ? c : " ");
			i++;
		}
		const attributes = [...own.join("").matchAll(/([A-Za-z_$][\w$:-]*)/g)].map(
			(a) => a[1],
		);
		tags.push({ index: m.index, attributes, hasSpread });
	}
	return tags;
}
