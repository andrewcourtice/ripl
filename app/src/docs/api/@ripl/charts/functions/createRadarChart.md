[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createRadarChart

# Function: createRadarChart()

> **createRadarChart**\<`TData`\>(`target`, `options`): [`RadarChart`](../classes/RadarChart.md)\<`TData`\>

Defined in: [charts/src/charts/radar.ts:432](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/radar.ts#L432)

Factory function that creates a new [RadarChart](../classes/RadarChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`RadarChartOptions`](../interfaces/RadarChartOptions.md)\<`TData`\> |

## Returns

[`RadarChart`](../classes/RadarChart.md)\<`TData`\>
