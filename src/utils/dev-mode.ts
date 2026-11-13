// src/utils/dev-mode.ts
//
// Whether this is a development build, for warnings that must not reach
// production. `process` is a Node global; bundlers (Vite, tsup) replace
// `process.env.NODE_ENV` at build time, so this works in both Node (vitest,
// SSR) and browser bundles. Reached through `globalThis` to avoid depending
// on `@types/node`.

/** Not a production build. */
export function isDevMode(): boolean {
	const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
		.process;
	return proc?.env?.NODE_ENV !== "production";
}
