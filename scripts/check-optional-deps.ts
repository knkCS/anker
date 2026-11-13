// Fails if a dist entry references an optional peer it does not own.
// Guards #147: react-grid-layout must only be reachable via ./dashboard.
// Guards #328: recharts must only be reachable via ./charts, so a consumer
// who never imports the charts entry never loads (or installs) Recharts.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Each optional peer and the one dist entry directory allowed to import it. */
const OPTIONAL_DEPS: Record<string, string> = {
	"react-grid-layout": "dashboard",
	recharts: "charts",
};

const distDir = join(process.cwd(), "dist");
const offenders: string[] = [];

function references(content: string, dep: string): boolean {
	// Match import/require specifiers (the package or a subpath of it), not the
	// string in a comment.
	const spec = `["']${dep}(?:/[^"']*)?["']`;
	return new RegExp(
		`(from\\s*${spec}|require\\(${spec}|import\\(${spec})`,
	).test(content);
}

function check(file: string, label: string, top: string | null) {
	if (!/\.(js|cjs|mjs)$/.test(file)) return;
	const content = readFileSync(file, "utf8");
	for (const [dep, allowed] of Object.entries(OPTIONAL_DEPS)) {
		if (top === allowed) continue;
		if (references(content, dep)) offenders.push(`${label} references ${dep}`);
	}
}

function walk(dir: string, top: string) {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) walk(full, top);
		else check(full, full.replace(`${distDir}/`, ""), top);
	}
}

for (const top of readdirSync(distDir)) {
	const full = join(distDir, top);
	if (statSync(full).isDirectory()) {
		walk(full, top);
	} else {
		// Shared chunks at dist root are reachable from every entry — they
		// must not reference optional deps either.
		check(full, `${top} (shared chunk)`, null);
	}
}

if (offenders.length > 0) {
	console.error("check-optional-deps: optional peer leaked outside its entry:");
	for (const o of offenders) console.error("  -", o);
	process.exit(1);
}
console.log(
	"check-optional-deps: ok — each optional peer only reachable via its own entry",
);
