[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createTreemapChart

# Function: createTreemapChart()

> **createTreemapChart**\<`TData`\>(`target`, `options`): [`TreemapChart`](../classes/TreemapChart.md)\<`TData`\>

Defined in: [charts/src/charts/treemap.ts:334](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/treemap.ts#L334)

Factory function that creates a new [TreemapChart](../classes/TreemapChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`TreemapChartOptions`](../interfaces/TreemapChartOptions.md)\<`TData`\> |

## Returns

[`TreemapChart`](../classes/TreemapChart.md)\<`TData`\>
