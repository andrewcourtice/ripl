[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / normalizeYAxisItem

# Function: normalizeYAxisItem()

> **normalizeYAxisItem**\<`TData`\>(`input?`, `defaults?`): [`ChartYAxisItemOptions`](../interfaces/ChartYAxisItemOptions.md)\<`TData`\>

Defined in: [charts/src/core/options.ts:492](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L492)

Normalizes a Y-axis item input into fully resolved options with position.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input?` | `boolean` \| `Partial`\<[`ChartYAxisItemOptions`](../interfaces/ChartYAxisItemOptions.md)\<`TData`\>\> |
| `defaults?` | `Partial`\<[`ChartYAxisItemOptions`](../interfaces/ChartYAxisItemOptions.md)\<`TData`\>\> |

## Returns

[`ChartYAxisItemOptions`](../interfaces/ChartYAxisItemOptions.md)\<`TData`\>
