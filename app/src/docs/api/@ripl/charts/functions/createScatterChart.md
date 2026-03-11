[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createScatterChart

# Function: createScatterChart()

> **createScatterChart**\<`TData`\>(`target`, `options`): [`ScatterChart`](../classes/ScatterChart.md)\<`TData`\>

Defined in: [charts/src/charts/scatter.ts:668](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L668)

Factory function that creates a new [ScatterChart](../classes/ScatterChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`ScatterChartOptions`](../interfaces/ScatterChartOptions.md)\<`TData`\> |

## Returns

[`ScatterChart`](../classes/ScatterChart.md)\<`TData`\>
