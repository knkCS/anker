import { Input } from "@chakra-ui/react";
import type React from "react";
import { Stack } from "../../primitives/layout";
import { NativeSelect } from "../../primitives/native-select";
import { Switch } from "../../primitives/switch";
import { Text } from "../../primitives/typography";
import type { WidgetSettingField } from "./types";

export interface WidgetConfigFormProps {
	schema: WidgetSettingField[];
	settings: Record<string, unknown>;
	onChange: (next: Record<string, unknown>) => void;
}

export const WidgetConfigForm: React.FC<WidgetConfigFormProps> = ({
	schema,
	settings,
	onChange,
}) => {
	const set = (key: string, value: unknown) =>
		onChange({ ...settings, [key]: value });

	return (
		<Stack gap={4}>
			{schema.map((field) => {
				const value = settings[field.key] ?? field.defaultValue;
				return (
					<Stack key={field.key} gap={1}>
						<Text fontSize="sm" fontWeight="medium">
							{field.label}
						</Text>
						{field.type === "boolean" ? (
							<Switch
								checked={Boolean(value)}
								onCheckedChange={(e) => set(field.key, e.checked)}
								inputProps={{ "aria-label": field.label }}
							/>
						) : field.type === "select" ? (
							<NativeSelect
								aria-label={field.label}
								value={String(value ?? "")}
								onChange={(e) => {
									const opt = field.options?.find(
										(o) => String(o.value) === e.target.value,
									);
									set(field.key, opt ? opt.value : e.target.value);
								}}
							>
								{field.options?.map((o) => (
									<option key={String(o.value)} value={String(o.value)}>
										{o.label}
									</option>
								))}
							</NativeSelect>
						) : field.type === "number" ? (
							<Input
								type="number"
								aria-label={field.label}
								value={
									value === undefined || value === null ? "" : String(value)
								}
								onChange={(e) =>
									set(
										field.key,
										e.target.value === "" ? undefined : Number(e.target.value),
									)
								}
							/>
						) : (
							<Input
								aria-label={field.label}
								value={
									value === undefined || value === null ? "" : String(value)
								}
								onChange={(e) => set(field.key, e.target.value)}
							/>
						)}
					</Stack>
				);
			})}
		</Stack>
	);
};
WidgetConfigForm.displayName = "WidgetConfigForm";
