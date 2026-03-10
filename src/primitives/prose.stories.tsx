import type { Meta, StoryObj } from "@storybook/react";
import { Prose } from "./prose";

const meta = {
	title: "Primitives/Prose",
	component: Prose,
} satisfies Meta<typeof Prose>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleHTML = `
<h1>Heading 1</h1>
<p>This is a paragraph with <a href="#">a link</a> and <strong>bold text</strong>.</p>
<h2>Heading 2</h2>
<p>Another paragraph with <em>italic text</em> and <code>inline code</code>.</p>
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
<blockquote>This is a blockquote.</blockquote>
<pre><code>const hello = "world";</code></pre>
`;

export const Default: Story = {
	render() {
		return <Prose dangerouslySetInnerHTML={{ __html: sampleHTML }} />;
	},
};

export const Large: Story = {
	render() {
		return <Prose size="lg" dangerouslySetInnerHTML={{ __html: sampleHTML }} />;
	},
};
