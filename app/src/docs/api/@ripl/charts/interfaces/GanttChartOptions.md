[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / GanttChartOptions

# Interface: GanttChartOptions\<TData\>

Defined in: [charts/src/charts/gantt.ts:58](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L58)

Options for configuring a [GanttChart](../classes/GanttChart.md).

## Extends

- [`BaseChartOptions`](BaseChartOptions.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-animation"></a> `animation?` | `boolean` \| `Partial`\<[`ChartAnimationOptions`](ChartAnimationOptions.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`animation`](BaseChartOptions.md#property-animation) | [charts/src/core/chart.ts:52](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L52) |
| <a id="property-autorender"></a> `autoRender?` | `boolean` | [`BaseChartOptions`](BaseChartOptions.md).[`autoRender`](BaseChartOptions.md#property-autorender) | [charts/src/core/chart.ts:49](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L49) |
| <a id="property-axis"></a> `axis?` | [`ChartAxisInput`](../type-aliases/ChartAxisInput.md)\<`TData`\> | - | [charts/src/charts/gantt.ts:68](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L68) |
| <a id="property-borderradius"></a> `borderRadius?` | `number` | - | [charts/src/charts/gantt.ts:71](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L71) |
| <a id="property-color"></a> `color?` | keyof `TData` \| (`item`) => `string` | - | [charts/src/charts/gantt.ts:64](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L64) |
| <a id="property-data"></a> `data` | `TData`[] | - | [charts/src/charts/gantt.ts:59](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L59) |
| <a id="property-end"></a> `end` | keyof `TData` \| (`item`) => `Date` | - | [charts/src/charts/gantt.ts:63](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L63) |
| <a id="property-grid"></a> `grid?` | [`ChartGridInput`](../type-aliases/ChartGridInput.md) | - | [charts/src/charts/gantt.ts:66](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L66) |
| <a id="property-key"></a> `key` | keyof `TData` \| (`item`) => `string` | - | [charts/src/charts/gantt.ts:60](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L60) |
| <a id="property-label"></a> `label` | keyof `TData` \| (`item`) => `string` | - | [charts/src/charts/gantt.ts:61](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L61) |
| <a id="property-padding"></a> `padding?` | `Partial`\<[`ChartPadding`](ChartPadding.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`padding`](BaseChartOptions.md#property-padding) | [charts/src/core/chart.ts:50](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L50) |
| <a id="property-progress"></a> `progress?` | keyof `TData` \| (`item`) => `number` | - | [charts/src/charts/gantt.ts:65](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L65) |
| <a id="property-showtoday"></a> `showToday?` | `boolean` | - | [charts/src/charts/gantt.ts:69](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L69) |
| <a id="property-start"></a> `start` | keyof `TData` \| (`item`) => `Date` | - | [charts/src/charts/gantt.ts:62](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L62) |
| <a id="property-title"></a> `title?` | `string` \| `Partial`\<[`ChartTitleOptions`](ChartTitleOptions.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`title`](BaseChartOptions.md#property-title) | [charts/src/core/chart.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L51) |
| <a id="property-todaycolor"></a> `todayColor?` | `string` | - | [charts/src/charts/gantt.ts:70](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L70) |
| <a id="property-tooltip"></a> `tooltip?` | [`ChartTooltipInput`](../type-aliases/ChartTooltipInput.md) | - | [charts/src/charts/gantt.ts:67](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gantt.ts#L67) |
