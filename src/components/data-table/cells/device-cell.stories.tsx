import type { Meta, StoryObj } from "@storybook/react";
import { DeviceCell } from "./device-cell";

const CHROME_MAC =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const SAFARI_IOS =
	"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const EDGE_WIN =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0";
const FIREFOX_LINUX =
	"Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0";

const meta = {
	title: "Components/DataTable/Cells/DeviceCell",
	component: DeviceCell,
	args: {
		userAgent: CHROME_MAC,
	},
} satisfies Meta<typeof DeviceCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChromeOnMac: Story = {
	args: { userAgent: CHROME_MAC },
};

export const SafariOnIOS: Story = {
	args: { userAgent: SAFARI_IOS },
};

export const EdgeOnWindows: Story = {
	args: { userAgent: EDGE_WIN },
};

export const FirefoxOnLinux: Story = {
	args: { userAgent: FIREFOX_LINUX },
};

export const WithBadge: Story = {
	args: {
		userAgent: CHROME_MAC,
		badge: { label: "Current", colorPalette: "green" },
	},
};

export const NullValue: Story = {
	args: { userAgent: null },
};
