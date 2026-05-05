/**
 * Parse a User-Agent string into a coarse browser + OS label.
 *
 * Used by `DeviceCell` to render "Chrome on macOS" style labels in
 * sessions / device lists. The matchers are intentionally simple —
 * they cover the common power-user browsers (Chrome, Safari, Firefox,
 * Edge, Opera) on the common platforms (macOS, Windows, iOS, Android,
 * Linux). Unknown browsers return `"Unknown"`; unknown OSes return `""`.
 */
export function parseUserAgent(ua: string | undefined | null): {
	browser: string;
	os: string;
} {
	if (!ua) return { browser: "Unknown", os: "" };

	// Browser detection — order matters because Chromium-based browsers
	// also match the Chrome and Safari markers.
	let browser = "Unknown";
	if (/Edg\//.test(ua)) browser = "Edge";
	else if (/Firefox\//.test(ua)) browser = "Firefox";
	else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
	else if (/Chrome\//.test(ua)) browser = "Chrome";
	else if (/Safari\//.test(ua)) browser = "Safari";

	// OS detection — iOS check precedes macOS so iPad/iPhone don't fall
	// through to the Macintosh matcher.
	let os = "";
	if (/Windows NT/.test(ua)) os = "Windows";
	else if (/iPhone|iPad/.test(ua)) os = "iOS";
	else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
	else if (/Android/.test(ua)) os = "Android";
	else if (/Linux/.test(ua)) os = "Linux";

	return { browser, os };
}

/** Format a parsed UA into the "Chrome on macOS" style label. */
export function formatUserAgent(ua: string | undefined | null): string {
	const { browser, os } = parseUserAgent(ua);
	return os ? `${browser} on ${os}` : browser;
}
