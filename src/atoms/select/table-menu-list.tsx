import { Box, Table } from "@chakra-ui/react";
import {
	chakraComponents,
	type GroupBase,
	type MenuListProps,
	type OptionProps,
} from "chakra-react-select";
import type React from "react";
import { useMemo } from "react";
import type { BaseOption } from "./types";

export interface TableMenuColumn {
	key: string;
	header: string;
	width?: string;
}

export interface TableMenuListProps<T extends BaseOption>
	extends MenuListProps<T, boolean, GroupBase<T>> {
	columns?: TableMenuColumn[];
	/** Minimum width of the table menu. Defaults to "400px" */
	minWidth?: string;
	/** Maximum width of the table menu. Defaults to "600px" */
	maxWidth?: string;
}

/**
 * A custom MenuList component that renders options as table rows.
 *
 * Use with BaseSelect by passing it via the `components` prop:
 * ```tsx
 * <BaseSelect
 *   components={{
 *     MenuList: (props) => (
 *       <TableMenuList
 *         {...props}
 *         columns={[
 *           { key: "label", header: "Name" },
 *           { key: "valid_from", header: "Valid From" },
 *         ]}
 *       />
 *     ),
 *     Option: TableOption,
 *   }}
 * />
 * ```
 */
export const TableMenuList = <T extends BaseOption>({
	children,
	columns,
	minWidth = "400px",
	maxWidth = "600px",
	...props
}: TableMenuListProps<T>) => {
	const { options } = props;

	// If no columns specified, derive from first option's data keys
	const derivedColumns = useMemo<TableMenuColumn[]>(() => {
		if (columns) return columns;

		const firstOption = options?.[0] as T | undefined;
		if (!firstOption?.data) {
			return [{ key: "label", header: "Name" }];
		}

		return [
			{ key: "label", header: "Name" },
			...Object.keys(firstOption.data).map((key) => ({
				key,
				header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
			})),
		];
	}, [columns, options]);

	return (
		<chakraComponents.MenuList {...props}>
			<Box
				overflowX="auto"
				minWidth={minWidth}
				maxWidth={maxWidth}
				width="max-content"
			>
				<Table.Root size="sm">
					<Table.Header>
						<Table.Row>
							{derivedColumns.map((col) => (
								<Table.ColumnHeader
									key={col.key}
									width={col.width}
									whiteSpace="nowrap"
								>
									{col.header}
								</Table.ColumnHeader>
							))}
						</Table.Row>
					</Table.Header>
					<Table.Body>{children}</Table.Body>
				</Table.Root>
			</Box>
		</chakraComponents.MenuList>
	);
};
(TableMenuList as { displayName?: string }).displayName = "TableMenuList";

/**
 * A custom Option component that renders as a table row.
 * Use together with TableMenuList.
 */
export const TableOption = <T extends BaseOption>({
	data,
	innerProps,
	isSelected,
	isFocused,
	columns,
}: OptionProps<T, boolean, GroupBase<T>> & { columns?: TableMenuColumn[] }) => {
	// Derive columns from data if not provided
	const derivedColumns = useMemo<TableMenuColumn[]>(() => {
		if (columns) return columns;

		if (!data.data) {
			return [{ key: "label", header: "Name" }];
		}

		return [
			{ key: "label", header: "Name" },
			...Object.keys(data.data).map((key) => ({
				key,
				header: key,
			})),
		];
	}, [columns, data.data]);

	const getCellValue = (col: TableMenuColumn): React.ReactNode => {
		if (col.key === "label") {
			return data.label;
		}
		if (col.key === "id") {
			return data.id;
		}
		if (data.data && col.key in data.data) {
			const value = data.data[col.key];
			if (value === null || value === undefined) return "-";
			return String(value);
		}
		return "-";
	};

	// Extract only the event handlers and data attributes from innerProps
	// The ref is incompatible with table rows, so we exclude it
	const { ref: _ref, ...rowProps } = innerProps;

	return (
		<Table.Row
			{...rowProps}
			_hover={{ bg: isFocused ? "bg-muted" : "bg-subtle" }}
			cursor="pointer"
			_even={{
				bg: isSelected ? "primary.subtle" : isFocused ? "bg-muted" : undefined,
			}}
		>
			{derivedColumns.map((col) => (
				<Table.Cell key={col.key} width={col.width} whiteSpace="nowrap">
					{getCellValue(col)}
				</Table.Cell>
			))}
		</Table.Row>
	);
};
(TableOption as { displayName?: string }).displayName = "TableOption";

export interface CreateTableMenuComponentsOptions {
	columns: TableMenuColumn[];
	/** Minimum width of the table menu. Defaults to "400px" */
	minWidth?: string;
	/** Maximum width of the table menu. Defaults to "600px" */
	maxWidth?: string;
}

/**
 * Helper to create table menu components with predefined columns.
 *
 * Usage:
 * ```tsx
 * const { MenuList, Option } = createTableMenuComponents({
 *   columns: [
 *     { key: "label", header: "Release" },
 *     { key: "valid_from", header: "Valid From" },
 *     { key: "valid_until", header: "Valid Until" },
 *   ],
 *   minWidth: "500px",
 *   maxWidth: "800px",
 * });
 *
 * <BaseSelect components={{ MenuList, Option }} />
 * ```
 */
export const createTableMenuComponents = <T extends BaseOption>(
	options: CreateTableMenuComponentsOptions,
) => ({
	MenuList: (props: MenuListProps<T, boolean, GroupBase<T>>) => (
		<TableMenuList
			{...props}
			columns={options.columns}
			minWidth={options.minWidth}
			maxWidth={options.maxWidth}
		/>
	),
	Option: (props: OptionProps<T, boolean, GroupBase<T>>) => (
		<TableOption {...props} columns={options.columns} />
	),
});
