[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / TrendChartOptions

# Interface: TrendChartOptions\<TData\>

Defined in: [charts/src/charts/trend.ts:112](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L112)

Options for configuring a [TrendChart](../classes/TrendChart.md).

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
| <a id="property-axis"></a> `axis?` | [`ChartAxisInput`](../type-aliases/ChartAxisInput.md)\<`TData`\> | - | [charts/src/charts/trend.ts:119](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L119) |
| <a id="property-data"></a> `data` | `TData`[] | - | [charts/src/charts/trend.ts:113](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L113) |
| <a id="property-grid"></a> `grid?` | [`ChartGridInput`](../type-aliases/ChartGridInput.md) | - | [charts/src/charts/trend.ts:116](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L116) |
| <a id="property-key"></a> `key` | keyof `TData` \| (`item`) => `string` | - | [charts/src/charts/trend.ts:115](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L115) |
| <a id="property-legend"></a> `legend?` | [`ChartLegendInput`](../type-aliases/ChartLegendInput.md) | - | [charts/src/charts/trend.ts:118](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L118) |
| <a id="property-padding"></a> `padding?` | `Partial`\<[`ChartPadding`](ChartPadding.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`padding`](BaseChartOptions.md#property-padding) | [charts/src/core/chart.ts:50](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L50) |
| <a id="property-series"></a> `series` | [`TrendChartSeriesOptions`](../type-aliases/TrendChartSeriesOptions.md)\<`TData`\>[] | - | [charts/src/charts/trend.ts:114](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L114) |
| <a id="property-title"></a> `title?` | `string` \| `Partial`\<[`ChartTitleOptions`](ChartTitleOptions.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`title`](BaseChartOptions.md#property-title) | [charts/src/core/chart.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L51) |
| <a id="property-tooltip"></a> `tooltip?` | [`ChartTooltipInput`](../type-aliases/ChartTooltipInput.md) | - | [charts/src/charts/trend.ts:117](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L117) |
