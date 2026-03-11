[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createHeatmapChart

# Function: createHeatmapChart()

> **createHeatmapChart**\<`TData`\>(`target`, `options`): [`HeatmapChart`](../classes/HeatmapChart.md)\<`TData`\>

Defined in: [charts/src/charts/heatmap.ts:409](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/heatmap.ts#L409)

Factory function that creates a new [HeatmapChart](../classes/HeatmapChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`HeatmapChartOptions`](../interfaces/HeatmapChartOptions.md)\<`TData`\> |

## Returns

[`HeatmapChart`](../classes/HeatmapChart.md)\<`TData`\>
