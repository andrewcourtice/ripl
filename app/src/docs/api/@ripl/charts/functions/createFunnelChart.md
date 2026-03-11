[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createFunnelChart

# Function: createFunnelChart()

> **createFunnelChart**\<`TData`\>(`target`, `options`): [`FunnelChart`](../classes/FunnelChart.md)\<`TData`\>

Defined in: [charts/src/charts/funnel.ts:260](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/funnel.ts#L260)

Factory function that creates a new [FunnelChart](../classes/FunnelChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`FunnelChartOptions`](../interfaces/FunnelChartOptions.md)\<`TData`\> |

## Returns

[`FunnelChart`](../classes/FunnelChart.md)\<`TData`\>
