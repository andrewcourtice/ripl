[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createLineChart

# Function: createLineChart()

> **createLineChart**\<`TData`\>(`target`, `options`): [`LineChart`](../classes/LineChart.md)\<`TData`\>

Defined in: [charts/src/charts/line.ts:599](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L599)

Factory function that creates a new [LineChart](../classes/LineChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`LineChartOptions`](../interfaces/LineChartOptions.md)\<`TData`\> |

## Returns

[`LineChart`](../classes/LineChart.md)\<`TData`\>
