[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createBarChart

# Function: createBarChart()

> **createBarChart**\<`TData`\>(`target`, `options`): [`BarChart`](../classes/BarChart.md)\<`TData`\>

Defined in: [charts/src/charts/bar.ts:874](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/bar.ts#L874)

Factory function that creates a new [BarChart](../classes/BarChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`BarChartOptions`](../interfaces/BarChartOptions.md)\<`TData`\> |

## Returns

[`BarChart`](../classes/BarChart.md)\<`TData`\>
