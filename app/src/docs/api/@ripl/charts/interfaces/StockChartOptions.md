[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / StockChartOptions

# Interface: StockChartOptions\<TData\>

Defined in: [charts/src/charts/stock.ts:66](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L66)

Options for configuring a [StockChart](../classes/StockChart.md).

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
| <a id="property-axis"></a> `axis?` | [`ChartAxisInput`](../type-aliases/ChartAxisInput.md)\<`TData`\> | - | [charts/src/charts/stock.ts:78](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L78) |
| <a id="property-close"></a> `close` | keyof `TData` \| (`item`) => `number` | - | [charts/src/charts/stock.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L72) |
| <a id="property-crosshair"></a> `crosshair?` | [`ChartCrosshairInput`](../type-aliases/ChartCrosshairInput.md) | - | [charts/src/charts/stock.ts:76](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L76) |
| <a id="property-data"></a> `data` | `TData`[] | - | [charts/src/charts/stock.ts:67](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L67) |
| <a id="property-downcolor"></a> `downColor?` | `string` | - | [charts/src/charts/stock.ts:80](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L80) |
| <a id="property-grid"></a> `grid?` | [`ChartGridInput`](../type-aliases/ChartGridInput.md) | - | [charts/src/charts/stock.ts:75](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L75) |
| <a id="property-high"></a> `high` | keyof `TData` \| (`item`) => `number` | - | [charts/src/charts/stock.ts:70](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L70) |
| <a id="property-key"></a> `key` | keyof `TData` \| (`item`) => `string` | - | [charts/src/charts/stock.ts:68](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L68) |
| <a id="property-low"></a> `low` | keyof `TData` \| (`item`) => `number` | - | [charts/src/charts/stock.ts:71](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L71) |
| <a id="property-open"></a> `open` | keyof `TData` \| (`item`) => `number` | - | [charts/src/charts/stock.ts:69](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L69) |
| <a id="property-padding"></a> `padding?` | `Partial`\<[`ChartPadding`](ChartPadding.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`padding`](BaseChartOptions.md#property-padding) | [charts/src/core/chart.ts:50](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L50) |
| <a id="property-showvolume"></a> `showVolume?` | `boolean` | - | [charts/src/charts/stock.ts:74](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L74) |
| <a id="property-title"></a> `title?` | `string` \| `Partial`\<[`ChartTitleOptions`](ChartTitleOptions.md)\> | [`BaseChartOptions`](BaseChartOptions.md).[`title`](BaseChartOptions.md#property-title) | [charts/src/core/chart.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/chart.ts#L51) |
| <a id="property-tooltip"></a> `tooltip?` | [`ChartTooltipInput`](../type-aliases/ChartTooltipInput.md) | - | [charts/src/charts/stock.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L77) |
| <a id="property-upcolor"></a> `upColor?` | `string` | - | [charts/src/charts/stock.ts:79](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L79) |
| <a id="property-volume"></a> `volume?` | keyof `TData` \| (`item`) => `number` | - | [charts/src/charts/stock.ts:73](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/stock.ts#L73) |
