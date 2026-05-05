// src/templates/auth-page-template.tsx
//
// AuthPageTemplate — full-bleed centered card on a neutral canvas. No app
// shell, no sidebar, no rail. Used for login, register, MFA challenge,
// forgot/reset password, and email-verification screens.
//
// Internally this is a thin wrapper around `<AuthCard>` (in
// `@knkcs/anker/components`) — surfaced under the templates module so
// consumers can import their layout chrome from one entry point.
//
// We re-expose the wrapper rather than re-implementing it because AuthCard
// is already battle-tested and stable; the templates module is the consumer
// contract, AuthCard is the implementation.

import type { ReactNode } from "react";
import { AuthCard, type AuthCardProps } from "../components/auth-card";

export interface AuthPageTemplateProps extends AuthCardProps {
	/**
	 * Page body — typically a form or a verification CTA. Inherits all
	 * AuthCard slots (logo, topBarRight, eyebrow, title, subtitle, footer).
	 */
	children: ReactNode;
}

/**
 * Auth-flow page layout. Use for any pre-authentication screen (login,
 * register, MFA, forgot-password, reset-password) and for short
 * confirmation flows (email-verify, account-deleted). For consent
 * dialogs, prefer `<OAuthConsentPageTemplate>` (denser layout).
 *
 * The template supplies a centered card with a dot-grid background, an
 * optional topbar with logo + locale switcher, and a footer slot. To hide
 * the topbar (rare — embedded preview, printable receipts) pass
 * `hideTopBar`. To hide the dot-grid (printable) pass `hideBackground`.
 */
export function AuthPageTemplate(props: AuthPageTemplateProps) {
	return <AuthCard {...props} />;
}
AuthPageTemplate.displayName = "AuthPageTemplate";
