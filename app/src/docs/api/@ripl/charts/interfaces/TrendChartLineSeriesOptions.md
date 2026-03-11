[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / TrendChartLineSeriesOptions

# Interface: TrendChartLineSeriesOptions\<TData\>

Defined in: [charts/src/charts/trend.ts:101](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L101)

Series options for line-type series within a trend chart.

## Extends

- [`BaseTrendChartSeriesOptions`](BaseTrendChartSeriesOptions.md)\<`TData`\>

## Type Parameters

| Type Parameter |
| ------ |
| `TData` |

## Properties

| Property | Type | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-color"></a> `color?` | `string` | - | [`BaseTrendChartSeriesOptions`](BaseTrendChartSeriesOptions.md).[`color`](BaseTrendChartSeriesOptions.md#property-color) | [charts/src/charts/trend.ts:84](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L84) |
| <a id="property-id"></a> `id` | `string` | - | [`BaseTrendChartSeriesOptions`](BaseTrendChartSeriesOptions.md).[`id`](BaseTrendChartSeriesOptions.md#property-id) | [charts/src/charts/trend.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L82) |
| <a id="property-label"></a> `label` | `string` \| (`item`) => `string` | - | [`BaseTrendChartSeriesOptions`](BaseTrendChartSeriesOptions.md).[`label`](BaseTrendChartSeriesOptions.md#property-label) | [charts/src/charts/trend.ts:86](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L86) |
| <a id="property-linetype"></a> `lineType?` | [`PolylineRenderer`](../../core/type-aliases/PolylineRenderer.md) | - | - | [charts/src/charts/trend.ts:103](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L103) |
| <a id="property-type"></a> `type` | `"line"` | [`BaseTrendChartSeriesOptions`](BaseTrendChartSeriesOptions.md).[`type`](BaseTrendChartSeriesOptions.md#property-type) | - | [charts/src/charts/trend.ts:102](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L102) |
| <a id="property-value"></a> `value` | `number` \| keyof `TData` \| (`item`) => `number` | - | [`BaseTrendChartSeriesOptions`](BaseTrendChartSeriesOptions.md).[`value`](BaseTrendChartSeriesOptions.md#property-value) | [charts/src/charts/trend.ts:85](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L85) |
