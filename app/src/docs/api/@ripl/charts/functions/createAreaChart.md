[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createAreaChart

# Function: createAreaChart()

> **createAreaChart**\<`TData`\>(`target`, `options`): [`AreaChart`](../classes/AreaChart.md)\<`TData`\>

Defined in: [charts/src/charts/area.ts:689](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/area.ts#L689)

Factory function that creates a new [AreaChart](../classes/AreaChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`AreaChartOptions`](../interfaces/AreaChartOptions.md)\<`TData`\> |

## Returns

[`AreaChart`](../classes/AreaChart.md)\<`TData`\>
