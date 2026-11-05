// src/utils/ui-locale.ts
//
// The UI language, for the components that format a value in it (dates). A hub
// already sets its language through react-i18next — `initReactI18next` and
// `i18n.changeLanguage` — so that is where anker reads it, and a hub needs no
// prop, provider or override to get its dates in its language. Only the
// LANGUAGE is read: anker still owns no translation keys (strings stay props).
//
// The order is: an explicit `locale` the caller passed, then the language of
// the nearest `I18nextProvider`, then the instance `initReactI18next`
// registered, then English. A language Intl cannot use (i18next's `cimode`, a
// malformed tag) is English too, so a date never renders in the runtime's
// default locale by accident.
import { useCallback, useContext, useSyncExternalStore } from "react";
import { getI18n, I18nContext } from "react-i18next";

const FALLBACK_LOCALE = "en";

type LanguageSource = {
	language?: string;
	on?: (event: "languageChanged", cb: () => void) => void;
	off?: (event: "languageChanged", cb: () => void) => void;
};

/** A locale Intl can format in, or English. */
function usableLocale(locale: string | undefined): string {
	if (!locale) return FALLBACK_LOCALE;
	try {
		return Intl.DateTimeFormat.supportedLocalesOf(locale).length > 0
			? locale
			: FALLBACK_LOCALE;
	} catch {
		return FALLBACK_LOCALE;
	}
}

function globalI18n(): LanguageSource | undefined {
	return getI18n() as LanguageSource | undefined;
}

/**
 * The locale to format in outside React: `locale` when given, else the UI
 * language of the instance `initReactI18next` registered, else English.
 */
export function resolveUiLocale(locale?: string): string {
	return usableLocale(locale ?? globalI18n()?.language);
}

/**
 * The locale to format in, inside a component: `locale` when given, else the
 * UI language (nearest `I18nextProvider`, then the registered instance), else
 * English. Re-renders when the UI language changes.
 */
export function useUiLocale(locale?: string): string {
	const context = useContext(I18nContext) as
		| { i18n?: LanguageSource }
		| undefined;
	const i18n = context?.i18n ?? globalI18n();

	const subscribe = useCallback(
		(onChange: () => void) => {
			if (!i18n?.on || !i18n.off) return () => {};
			i18n.on("languageChanged", onChange);
			return () => i18n.off?.("languageChanged", onChange);
		},
		[i18n],
	);
	const language = useSyncExternalStore(
		subscribe,
		() => i18n?.language,
		() => i18n?.language,
	);

	return usableLocale(locale ?? language);
}
