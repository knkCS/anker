// src/rules/index.ts
//
// @knkcs/anker/rules — the mechanical half of CLAUDE-ANKER.md, for a
// consuming package's `anker-rules.test.ts`. Pure string checks: no React,
// no Chakra, no file system — the package reads its own sources.

export type {
	AnkerRuleId,
	AnkerRuleSource,
	AnkerRuleViolation,
} from "./check-anker-rules";
export { checkAnkerRules } from "./check-anker-rules";
