/**
 * Lint rule: prevent importing wrapped components directly from @chakra-ui/react.
 *
 * Components that have Anker primitives/atoms wrappers must be imported from
 * the Anker layer, not from Chakra directly. This script checks for violations
 * in src/atoms/, src/components/, src/forms/, src/feedback/, and src/stories/.
 *
 * Run: npx tsx scripts/check-chakra-imports.ts
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** Components that have Anker wrappers — importing these from @chakra-ui/react is a violation. */
const WRAPPED_COMPONENTS = new Set([
	// Layout (primitives/layout)
	"Box",
	"Center",
	"Container",
	"Flex",
	"Grid",
	"GridItem",
	"HStack",
	"Spacer",
	"Stack",
	"VStack",
	// Typography (primitives/typography)
	"Text",
	"Heading",
	"Code",
	"Link",
	// Individual primitives
	"Badge",
	"Checkbox",
	"CheckboxGroup",
	"Collapsible",
	"Separator",
	"Table",
	"Textarea",
	"RadioGroup",
	// Atoms
	"Button",
	"IconButton",
]);

/**
 * Files exempt from the rule. Two categories:
 * 1. Wrapper files — they ARE the Anker wrappers, must import from Chakra
 * 2. Compound API consumers — they use Chakra sub-components (e.g., Checkbox.Root)
 *    that the Anker wrapper doesn't expose
 */
const EXEMPT_FILE_PATTERNS = [
	// Wrapper layer — imports from Chakra are expected
	/src\/primitives\//,
	/src\/theme\//,
	// Atom wrapper source files
	/src\/atoms\/button\/button\.tsx$/,
	/src\/atoms\/button\/icon-button\.tsx$/,
	/src\/atoms\/data-list\/data-list\.tsx$/,
	/src\/atoms\/text-input\/text-input\.tsx$/,
	/src\/atoms\/persona\/persona\.tsx$/,
	/src\/atoms\/date-input\/date-input\.tsx$/,
	/src\/atoms\/checkbox-card\/checkbox-card\.tsx$/,
	/src\/atoms\/clipboard\/clipboard\.tsx$/,
	// Compound API consumers — use Chakra sub-components (Checkbox.Root, Table.Root, etc.)
	/src\/atoms\/comment\/comment-reply-box\.tsx$/, // Uses Chakra Button inside atom internals
	/src\/components\/data-table\/data-table\.tsx$/, // Uses Checkbox.Root/.HiddenInput/.Control compound
	/src\/forms\/checkbox-field\.tsx$/, // Uses Checkbox.Root/.HiddenInput/.Control/.Indicator/.Label compound
	/src\/forms\/array-field\.tsx$/, // Uses Chakra Button/IconButton as form primitives
	/src\/forms\/file-field\.tsx$/, // Uses Chakra Button as form primitive
	/src\/forms\/color-picker-field\.tsx$/, // Uses Chakra IconButton as form primitive
	/src\/feedback\/confirm-modal\.tsx$/, // Wraps Dialog compound with Chakra Button
];

const SCAN_DIRS = ["src/atoms", "src/components", "src/forms", "src/feedback", "src/stories"];
const CHAKRA_IMPORT_RE = /import\s+\{([^}]+)\}\s+from\s+["']@chakra-ui\/react["']/g;
const TYPE_IMPORT_RE = /import\s+type\s+\{[^}]+\}\s+from\s+["']@chakra-ui\/react["']/g;

interface Violation {
	file: string;
	line: number;
	components: string[];
}

function isExemptFile(filePath: string): boolean {
	return EXEMPT_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function collectFiles(dir: string): string[] {
	const files: string[] = [];
	try {
		for (const entry of readdirSync(dir)) {
			const full = join(dir, entry);
			const stat = statSync(full);
			if (stat.isDirectory()) {
				files.push(...collectFiles(full));
			} else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
				files.push(full);
			}
		}
	} catch {
		// Directory doesn't exist
	}
	return files;
}

function checkFile(filePath: string): Violation[] {
	if (isExemptFile(filePath)) return [];

	const content = readFileSync(filePath, "utf-8");
	const lines = content.split("\n");
	const violations: Violation[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Skip type-only imports
		if (line.match(/^\s*import\s+type\s/)) continue;

		// Check for @chakra-ui/react imports
		const importMatch = line.match(/import\s+\{([^}]+)\}\s+from\s+["']@chakra-ui\/react["']/);
		if (!importMatch) continue;

		const imported = importMatch[1]
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean)
			.map((s) => {
				// Handle "type Foo" inline type imports
				if (s.startsWith("type ")) return null;
				// Handle "Foo as Bar" aliases
				const parts = s.split(/\s+as\s+/);
				return parts[0].trim();
			})
			.filter((s): s is string => s !== null);

		const violating = imported.filter((name) => WRAPPED_COMPONENTS.has(name));
		if (violating.length > 0) {
			violations.push({
				file: relative(process.cwd(), filePath),
				line: i + 1,
				components: violating,
			});
		}
	}

	return violations;
}

// Main
const allFiles = SCAN_DIRS.flatMap((dir) => collectFiles(dir));
const allViolations = allFiles.flatMap((f) => checkFile(f));

if (allViolations.length === 0) {
	console.log("✓ No Chakra direct import violations found.");
	process.exit(0);
} else {
	console.error(`✗ Found ${allViolations.length} Chakra direct import violation(s):\n`);
	for (const v of allViolations) {
		console.error(
			`  ${v.file}:${v.line} — ${v.components.join(", ")} should be imported from Anker primitives/atoms, not @chakra-ui/react`,
		);
	}
	console.error(
		"\nThese components have Anker wrappers. Import from the wrapper instead:",
	);
	console.error("  Layout (Box, Flex, etc.)  → from '../../primitives/layout'");
	console.error("  Typography (Text, Heading) → from '../../primitives/typography'");
	console.error("  Badge                     → from '../../primitives/badge'");
	console.error("  Checkbox                  → from '../../primitives/checkbox'");
	console.error("  Table                     → from '../../primitives/table'");
	console.error("  Separator                 → from '../../primitives/separator'");
	console.error("  Textarea                  → from '../../primitives/textarea'");
	console.error("  Button/IconButton         → from '../../atoms/button/button'");
	process.exit(1);
}
