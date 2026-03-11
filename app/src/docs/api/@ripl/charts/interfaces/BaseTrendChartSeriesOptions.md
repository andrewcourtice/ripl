[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / BaseTrendChartSeriesOptions

# Interface: BaseTrendChartSeriesOptions\<TData\>

Defined in: [charts/src/charts/trend.ts:81](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L81)

Base configuration shared by all trend chart series types.

## Extended by

- [`TrendChartBarSeriesOptions`](TrendChartBarSeriesOptions.md)
- [`TrendChartAreaSeriesOptions`](TrendChartAreaSeriesOptions.md)
- [`TrendChartLineSeriesOptions`](TrendChartLineSeriesOptions.md)

## Type Parameters

| Type Parameter |
| ------ |
| `TData` |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-color"></a> `color?` | `string` | [charts/src/charts/trend.ts:84](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L84) |
| <a id="property-id"></a> `id` | `string` | [charts/src/charts/trend.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L82) |
| <a id="property-label"></a> `label` | `string` \| (`item`) => `string` | [charts/src/charts/trend.ts:86](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L86) |
| <a id="property-type"></a> `type` | [`SeriesType`](../type-aliases/SeriesType.md) | [charts/src/charts/trend.ts:83](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L83) |
| <a id="property-value"></a> `value` | `number` \| keyof `TData` \| (`item`) => `number` | [charts/src/charts/trend.ts:85](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/trend.ts#L85) |
