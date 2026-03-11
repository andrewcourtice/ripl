[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / normalizeAxisItem

# Function: normalizeAxisItem()

> **normalizeAxisItem**\<`TData`\>(`input?`, `defaults?`): [`ChartAxisItemOptions`](../interfaces/ChartAxisItemOptions.md)\<`TData`\>

Defined in: [charts/src/core/options.ts:465](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L465)

Normalizes a single axis item input into fully resolved options.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input?` | `boolean` \| `Partial`\<[`ChartAxisItemOptions`](../interfaces/ChartAxisItemOptions.md)\<`TData`\>\> |
| `defaults?` | `Partial`\<[`ChartAxisItemOptions`](../interfaces/ChartAxisItemOptions.md)\<`TData`\>\> |

## Returns

[`ChartAxisItemOptions`](../interfaces/ChartAxisItemOptions.md)\<`TData`\>
