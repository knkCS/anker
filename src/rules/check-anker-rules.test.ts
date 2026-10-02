import { describe, expect, it } from "vitest";
import { checkAnkerRules } from "./check-anker-rules";

const check = (text: string, file = "screen.tsx") =>
	checkAnkerRules([{ file, text }]);
const rules = (text: string) => check(text).map((v) => v.rule);

describe("checkAnkerRules", () => {
	it("passes a clean source", () => {
		expect(
			check(`
import { Card } from "@knkcs/anker/components";
import { SettingsPageTemplate } from "@knkcs/anker/templates";
export const Screen = () => (
	<SettingsPageTemplate title="Settings" tabs={<Tabs />}>
		<Card title="General">x</Card>
	</SettingsPageTemplate>
);`),
		).toEqual([]);
	});

	describe("no-raw-chakra", () => {
		it("flags an import from @chakra-ui", () => {
			const [v] = check(
				`import { Box } from "@chakra-ui/react";\nexport {};`,
				"a.tsx",
			);
			expect(v).toMatchObject({
				rule: "no-raw-chakra",
				file: "a.tsx",
				line: 1,
			});
		});

		it("ignores the specifier inside a comment", () => {
			expect(
				rules(`// never: import { Box } from "@chakra-ui/react";`),
			).toEqual([]);
		});
	});

	describe("no-hex-colour", () => {
		it("flags a quoted hex colour", () => {
			expect(rules(`const c = { color: "#134788" };`)).toEqual([
				"no-hex-colour",
			]);
			expect(rules(`<Box bg='#fff' />`)).toEqual(["no-hex-colour"]);
		});

		it("leaves anchors and tokens alone", () => {
			expect(rules(`<a href="#top" /> <Box bg="bg-surface" />`)).toEqual([]);
		});
	});

	describe("settings-template-needs-tabs", () => {
		it("flags SettingsPageTemplate rendered without tabs", () => {
			const text = `const x = 1;\nexport const S = () => (\n\t<SettingsPageTemplate title="Editor settings" actions={<Save />}>\n\t\t<Form />\n\t</SettingsPageTemplate>\n);`;
			const [v] = check(text);
			expect(v).toMatchObject({
				rule: "settings-template-needs-tabs",
				line: 3,
			});
			expect(v.message).toMatch(/DetailPageTemplate/);
		});

		it("flags a self-closing one", () => {
			expect(rules(`<SettingsPageTemplate title="x" />`)).toEqual([
				"settings-template-needs-tabs",
			]);
		});

		it("accepts tabs passed as a prop, shorthand or spread", () => {
			expect(rules(`<SettingsPageTemplate title="x" tabs={tabs}>`)).toEqual([]);
			expect(rules(`<SettingsPageTemplate\n\ttitle="x"\n\ttabs\n/>`)).toEqual(
				[],
			);
			expect(rules(`<SettingsPageTemplate {...props} />`)).toEqual([]);
		});

		it("is not fooled by `tabs` inside another prop's expression or string", () => {
			expect(
				rules(
					`<SettingsPageTemplate title="tabs" actions={<Button onClick={() => go(tabs)}>tabs</Button>}>`,
				),
			).toEqual(["settings-template-needs-tabs"]);
		});

		it("does not read `=>` inside an expression as the end of the tag", () => {
			expect(
				rules(
					`<SettingsPageTemplate actions={<B onClick={() => x > 1} />} tabs={t}>`,
				),
			).toEqual([]);
		});

		it("ignores a commented-out example and other components", () => {
			expect(
				rules(
					`/* <SettingsPageTemplate title="x" /> */\n// <SettingsPageTemplate />\n<SettingsPageTemplateish />`,
				),
			).toEqual([]);
		});
	});

	describe("no-card-max-width", () => {
		it("flags maxW or maxWidth on a Card", () => {
			expect(rules(`<Card title="General" maxW="xl">`)).toEqual([
				"no-card-max-width",
			]);
			expect(rules(`<Card\n\tmaxWidth={640}\n/>`)).toEqual([
				"no-card-max-width",
			]);
		});

		it("leaves other components and other props alone", () => {
			expect(
				rules(
					`<Box maxW="xl" /> <SelectableCard maxW="xs" /> <Card title="maxW" />`,
				),
			).toEqual([]);
		});
	});

	it("reports every violation across files, in file order", () => {
		const violations = checkAnkerRules([
			{ file: "a.tsx", text: `<Card maxW="sm" />` },
			{
				file: "b.tsx",
				text: `import x from "@chakra-ui/react";\n<SettingsPageTemplate />`,
			},
		]);
		expect(violations.map((v) => [v.file, v.rule, v.line])).toEqual([
			["a.tsx", "no-card-max-width", 1],
			["b.tsx", "no-raw-chakra", 1],
			["b.tsx", "settings-template-needs-tabs", 2],
		]);
	});
});
