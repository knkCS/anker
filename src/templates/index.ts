// src/templates/index.ts
//
// @knkcs/anker/templates — page-level layout templates.
//
// Templates are the contract: they encode anker's page-pattern decisions
// (header chrome, toolbar placement, rail behavior, content padding) so
// every knkCMS solution renders the same way. If a template doesn't fit
// your page, file an issue — don't reinvent the layout.
//
// See `docs/page-patterns.md` for the full specification.

// AppShell + slot hooks
export type { AppShellProps } from "./app-shell";
export { AppShell, usePageActions, usePageHeader, usePageRail } from "./app-shell";
// Unauthenticated / chromeless templates
export type { AuthPageTemplateProps } from "./auth-page-template";
export { AuthPageTemplate } from "./auth-page-template";
export type { DashboardPageTemplateProps } from "./dashboard-page-template";
export { DashboardPageTemplate } from "./dashboard-page-template";
export type { DetailPageTemplateProps } from "./detail-page-template";
export { DetailPageTemplate } from "./detail-page-template";
// Status / system pages
export type { ErrorPageProps } from "./error-page";
export { ErrorPage } from "./error-page";
// Authenticated page templates
export type { IndexPageTemplateProps } from "./index-page-template";
export { IndexPageTemplate } from "./index-page-template";
export type { LoadingPageProps } from "./loading-page";
export { LoadingPage } from "./loading-page";
export type { MaintenancePageProps } from "./maintenance-page";
export { MaintenancePage } from "./maintenance-page";
export type { MarketingPageTemplateProps } from "./marketing-page-template";
export { MarketingPageTemplate } from "./marketing-page-template";
export type { SettingsPageTemplateProps } from "./settings-page-template";
export { SettingsPageTemplate } from "./settings-page-template";
