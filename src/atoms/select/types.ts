import type React from "react";

export interface BaseOption {
	id: string;
	label: string;
	avatar?: string;
	color?: string;
	icon?: React.ReactNode;
	data?: Record<string, unknown>;
}
