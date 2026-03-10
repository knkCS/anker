import type { Meta, StoryObj } from "@storybook/react";
import { Prose } from "./prose";

const meta = {
	title: "Primitives/Prose",
	component: Prose,
} satisfies Meta<typeof Prose>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<Prose>
				<h1>Heading 1</h1>
				<p>
					This is a paragraph with <a href="https://example.com">a link</a> and{" "}
					<strong>bold text</strong>.
				</p>
				<h2>Heading 2</h2>
				<p>
					Another paragraph with <em>italic text</em> and{" "}
					<code>inline code</code>.
				</p>
				<ul>
					<li>First item</li>
					<li>Second item</li>
					<li>Third item</li>
				</ul>
				<blockquote>This is a blockquote.</blockquote>
				<pre>
					<code>{'const hello = "world";'}</code>
				</pre>
			</Prose>
		);
	},
};

export const Large: Story = {
	render() {
		return (
			<Prose size="lg">
				<h1>Large Prose</h1>
				<p>This uses the large size variant with a bigger base font size.</p>
				<h2>Sub-heading</h2>
				<ol>
					<li>Ordered item one</li>
					<li>Ordered item two</li>
				</ol>
			</Prose>
		);
	},
};
