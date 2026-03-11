[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createTrendChart

# Function: createTrendChart()

> **createTrendChart**\<`TData`\>(`target`, `options`): [`TrendChart`](../classes/TrendChart.md)\<`TData`\>

Defined in: [charts/src/charts/trend.ts:783](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L783)

Factory function that creates a new [TrendChart](../classes/TrendChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`TrendChartOptions`](../interfaces/TrendChartOptions.md)\<`TData`\> |

## Returns

[`TrendChart`](../classes/TrendChart.md)\<`TData`\>
