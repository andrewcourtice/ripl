[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / createGanttChart

# Function: createGanttChart()

> **createGanttChart**\<`TData`\>(`target`, `options`): [`GanttChart`](../classes/GanttChart.md)\<`TData`\>

Defined in: [charts/src/charts/gantt.ts:593](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L593)

Factory function that creates a new [GanttChart](../classes/GanttChart.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `string` \| `HTMLElement` \| [`Context`](../../core/classes/Context.md)\<`Element`\> |
| `options` | [`GanttChartOptions`](../interfaces/GanttChartOptions.md)\<`TData`\> |

## Returns

[`GanttChart`](../classes/GanttChart.md)\<`TData`\>
