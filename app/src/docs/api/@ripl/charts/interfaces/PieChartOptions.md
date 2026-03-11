[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / PieChartOptions

# Interface: PieChartOptions\<TData\>

Defined in: [charts/src/charts/pie.ts:50](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/pie.ts#L50)

Options for configuring a [PieChart](../classes/PieChart.md).

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
| <a id="property-color"></a> `color?` | keyof `TData` \| (`item`) => `string` | - | [charts/src/charts/pie.ts:55](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/pie.ts#L55) |
| <a id="property-data"></a> `data` | `TData`[] | - | [charts/src/charts/pie.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/pie.ts#L51) |
| <a id="property-innerradius"></a> `innerRadius?` | `number` | - | [charts/src/charts/pie.ts:56](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/pie.ts#L56) |
| <a id="property-key"></a> `key` | keyof `TData` \| (`item`) => `string` | - | [charts/src/charts/pie.ts:52](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/pie.ts#L52) |
| <a id="property-label"></a> `label` | keyof `TData` \| (`item`) => `string` | - | [charts/src/charts/pie.ts:54](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/pie.ts#L54) |
| <a id="property-legend"></a> `legend?` | [`ChartLegendInput`](../type-aliases/ChartLegendInput.md) | - | [charts/src/charts/pie.ts:57](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/pie.ts#L57) |
| <a id="property-padding"></a> `padding?` | `Partial`\<[`ChartPadding`](ChartPadding.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`padding`](BaseChartOptions.md#property-padding) | [charts/src/core/chart.ts:50](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L50) |
| <a id="property-title"></a> `title?` | `string` \| `Partial`\<[`ChartTitleOptions`](ChartTitleOptions.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`title`](BaseChartOptions.md#property-title) | [charts/src/core/chart.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L51) |
| <a id="property-value"></a> `value` | keyof `TData` \| (`item`) => `number` | - | [charts/src/charts/pie.ts:53](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/pie.ts#L53) |
