[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / GaugeChartOptions

# Interface: GaugeChartOptions

Defined in: [charts/src/charts/gauge.ts:19](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L19)

Options for configuring a [GaugeChart](../classes/GaugeChart.md).

## Extends

- [`BaseChartOptions`](BaseChartOptions.md)

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-animation"></a> `animation?` | `boolean` \| `Partial`\<[`ChartAnimationOptions`](ChartAnimationOptions.md)\> | - | [`BaseChartOptions`](BaseChartOptions.md).[`animation`](BaseChartOptions.md#property-animation) | [charts/src/core/chart.ts:52](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L52) |
| <a id="property-autorender"></a> `autoRender?` | `boolean` | - | [`BaseChartOptions`](BaseChartOptions.md).[`autoRender`](BaseChartOptions.md#property-autorender) | [charts/src/core/chart.ts:49](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L49) |
| <a id="property-color"></a> `color?` | `string` | - | - | [charts/src/charts/gauge.ts:24](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L24) |
| <a id="property-formatticklabel"></a> `formatTickLabel?` | (`value`) => `string` | Format function for tick labels | - | [charts/src/charts/gauge.ts:32](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L32) |
| <a id="property-formatvalue"></a> `formatValue?` | (`value`) => `string` | - | - | [charts/src/charts/gauge.ts:26](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L26) |
| <a id="property-label"></a> `label?` | `string` | - | - | [charts/src/charts/gauge.ts:23](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L23) |
| <a id="property-max"></a> `max?` | `number` | - | - | [charts/src/charts/gauge.ts:22](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L22) |
| <a id="property-min"></a> `min?` | `number` | - | - | [charts/src/charts/gauge.ts:21](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L21) |
| <a id="property-padding"></a> `padding?` | `Partial`\<[`ChartPadding`](ChartPadding.md)\> | - | [`BaseChartOptions`](BaseChartOptions.md).[`padding`](BaseChartOptions.md#property-padding) | [charts/src/core/chart.ts:50](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L50) |
| <a id="property-showticklabels"></a> `showTickLabels?` | `boolean` | Whether to show value labels at each tick. Defaults to true. | - | [charts/src/charts/gauge.ts:30](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L30) |
| <a id="property-tickcount"></a> `tickCount?` | `number` | Number of tick marks along the gauge arc. Defaults to 5. Set to 0 to hide. | - | [charts/src/charts/gauge.ts:28](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L28) |
| <a id="property-title"></a> `title?` | `string` \| `Partial`\<[`ChartTitleOptions`](ChartTitleOptions.md)\> | - | [`BaseChartOptions`](BaseChartOptions.md).[`title`](BaseChartOptions.md#property-title) | [charts/src/core/chart.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L51) |
| <a id="property-trackcolor"></a> `trackColor?` | `string` | - | - | [charts/src/charts/gauge.ts:25](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L25) |
| <a id="property-value"></a> `value` | `number` | - | - | [charts/src/charts/gauge.ts:20](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/gauge.ts#L20) |
