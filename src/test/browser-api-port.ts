// Where the `layout` project binds vitest's browser API (`test.browser.api`),
// read by vitest.config.ts.
//
// An agent run of the agent control plane may bind only its reserved loopback
// ports, and keeps one of them for browser tests in ACP_BROWSER_TEST_PORT
// (knkCS/agent-control-plane#857). vitest's default browser port (63315) is
// refused there. Without the variable (a developer's machine, CI) vitest's
// default stays. A malformed value fails the run rather than being ignored.

export function browserApi(
	env: Record<string, string | undefined>,
): { port: number; strictPort: true } | undefined {
	const raw = env.ACP_BROWSER_TEST_PORT;
	if (raw === undefined || raw === "") {
		return undefined;
	}
	const port = Number(raw);
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(`ACP_BROWSER_TEST_PORT=${raw} is not a port`);
	}
	return { port, strictPort: true };
}
