[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / ScatterChartOptions

# Interface: ScatterChartOptions\<TData\>

Defined in: [charts/src/charts/scatter.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L82)

Options for configuring a [ScatterChart](../classes/ScatterChart.md).

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
| <a id="property-axis"></a> `axis?` | [`ChartAxisInput`](../type-aliases/ChartAxisInput.md)\<`TData`\> | - | [charts/src/charts/scatter.ts:90](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L90) |
| <a id="property-crosshair"></a> `crosshair?` | [`ChartCrosshairInput`](../type-aliases/ChartCrosshairInput.md) | - | [charts/src/charts/scatter.ts:87](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L87) |
| <a id="property-data"></a> `data` | `TData`[] | - | [charts/src/charts/scatter.ts:83](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L83) |
| <a id="property-grid"></a> `grid?` | [`ChartGridInput`](../type-aliases/ChartGridInput.md) | - | [charts/src/charts/scatter.ts:86](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L86) |
| <a id="property-key"></a> `key` | keyof `TData` \| (`item`) => `string` | - | [charts/src/charts/scatter.ts:85](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L85) |
| <a id="property-legend"></a> `legend?` | [`ChartLegendInput`](../type-aliases/ChartLegendInput.md) | - | [charts/src/charts/scatter.ts:89](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L89) |
| <a id="property-padding"></a> `padding?` | `Partial`\<[`ChartPadding`](ChartPadding.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`padding`](BaseChartOptions.md#property-padding) | [charts/src/core/chart.ts:50](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L50) |
| <a id="property-series"></a> `series` | [`ScatterChartSeriesOptions`](ScatterChartSeriesOptions.md)\<`TData`\>[] | - | [charts/src/charts/scatter.ts:84](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L84) |
| <a id="property-title"></a> `title?` | `string` \| `Partial`\<[`ChartTitleOptions`](ChartTitleOptions.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`title`](BaseChartOptions.md#property-title) | [charts/src/core/chart.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L51) |
| <a id="property-tooltip"></a> `tooltip?` | [`ChartTooltipInput`](../type-aliases/ChartTooltipInput.md) | - | [charts/src/charts/scatter.ts:88](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L88) |
