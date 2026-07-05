// Fails if any non-dashboard dist entry references an optional peer.
// Guards #147: react-grid-layout must only be reachable via ./dashboard.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const OPTIONAL_DEPS = ["react-grid-layout"];
const ALLOWED_DIRS = new Set(["dashboard"]);

const distDir = join(process.cwd(), "dist");
const offenders: string[] = [];

function walk(dir: string, topLevel: string) {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) {
			walk(full, topLevel);
		} else if (/\.(js|cjs|mjs)$/.test(name)) {
			const content = readFileSync(full, "utf8");
			for (const dep of OPTIONAL_DEPS) {
				// Match import/require specifiers, not the string in a comment:
				if (new RegExp(`(from\\s*["']${dep}|require\\(["']${dep}|import\\(["']${dep})`).test(content)) {
					offenders.push(`${full.replace(distDir + "/", "")} references ${dep}`);
				}
			}
		}
	}
}

for (const top of readdirSync(distDir)) {
	const full = join(distDir, top);
	if (!statSync(full).isDirectory()) {
		// Shared chunks at dist root are reachable from every entry — they
		// must not reference optional deps either.
		if (/\.(js|cjs|mjs)$/.test(top)) {
			const content = readFileSync(full, "utf8");
			for (const dep of OPTIONAL_DEPS) {
				if (new RegExp(`(from\\s*["']${dep}|require\\(["']${dep}|import\\(["']${dep})`).test(content)) {
					offenders.push(`${top} (shared chunk) references ${dep}`);
				}
			}
		}
		continue;
	}
	if (ALLOWED_DIRS.has(top)) continue;
	walk(full, top);
}

if (offenders.length > 0) {
	console.error("check-optional-deps: optional peer leaked into non-dashboard entries:");
	for (const o of offenders) console.error("  -", o);
	process.exit(1);
}
console.log("check-optional-deps: ok — optional peers only reachable via ./dashboard");
