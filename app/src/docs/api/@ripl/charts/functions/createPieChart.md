[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createPieChart

# Function: createPieChart()

> **createPieChart**\<`TData`\>(`target`, `options`): [`PieChart`](../classes/PieChart.md)\<`TData`\>

Defined in: [charts/src/charts/pie.ts:400](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/pie.ts#L400)

Factory function that creates a new [PieChart](../classes/PieChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`PieChartOptions`](../interfaces/PieChartOptions.md)\<`TData`\> |

## Returns

[`PieChart`](../classes/PieChart.md)\<`TData`\>
