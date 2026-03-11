[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / PolarAreaChartOptions

# Interface: PolarAreaChartOptions\<TData\>

Defined in: [charts/src/charts/polar-area.ts:38](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L38)

Options for configuring a [PolarAreaChart](../classes/PolarAreaChart.md).

## Extends

- [`BaseChartOptions`](BaseChartOptions.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-animation"></a> `animation?` | `boolean` \| `Partial`\<[`ChartAnimationOptions`](ChartAnimationOptions.md)\> | - | [`BaseChartOptions`](BaseChartOptions.md).[`animation`](BaseChartOptions.md#property-animation) | [charts/src/core/chart.ts:52](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L52) |
| <a id="property-autorender"></a> `autoRender?` | `boolean` | - | [`BaseChartOptions`](BaseChartOptions.md).[`autoRender`](BaseChartOptions.md#property-autorender) | [charts/src/core/chart.ts:49](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L49) |
| <a id="property-color"></a> `color?` | keyof `TData` \| (`item`) => `string` | - | - | [charts/src/charts/polar-area.ts:43](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L43) |
| <a id="property-data"></a> `data` | `TData`[] | - | - | [charts/src/charts/polar-area.ts:39](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L39) |
| <a id="property-innerradiusratio"></a> `innerRadiusRatio?` | `number` | Inner radius ratio (0 - 1). Defaults to 0.15 | - | [charts/src/charts/polar-area.ts:45](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L45) |
| <a id="property-key"></a> `key` | keyof `TData` \| (`item`) => `string` | - | - | [charts/src/charts/polar-area.ts:40](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L40) |
| <a id="property-label"></a> `label` | keyof `TData` \| (`item`) => `string` | - | - | [charts/src/charts/polar-area.ts:42](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L42) |
| <a id="property-levels"></a> `levels?` | `number` | Number of concentric grid rings. Defaults to 4 | - | [charts/src/charts/polar-area.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L51) |
| <a id="property-maxradiusratio"></a> `maxRadiusRatio?` | `number` | Maximum radius ratio (0 - 0.5). Defaults to 0.45 (similar to pie chart). | - | [charts/src/charts/polar-area.ts:47](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L47) |
| <a id="property-padangle"></a> `padAngle?` | `number` | Padding angle between segments in radians. Defaults to 0.02 | - | [charts/src/charts/polar-area.ts:49](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L49) |
| <a id="property-padding"></a> `padding?` | `Partial`\<[`ChartPadding`](ChartPadding.md)\> | - | [`BaseChartOptions`](BaseChartOptions.md).[`padding`](BaseChartOptions.md#property-padding) | [charts/src/core/chart.ts:50](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L50) |
| <a id="property-title"></a> `title?` | `string` \| `Partial`\<[`ChartTitleOptions`](ChartTitleOptions.md)\> | - | [`BaseChartOptions`](BaseChartOptions.md).[`title`](BaseChartOptions.md#property-title) | [charts/src/core/chart.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L51) |
| <a id="property-value"></a> `value` | keyof `TData` \| (`item`) => `number` | - | - | [charts/src/charts/polar-area.ts:41](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/polar-area.ts#L41) |
