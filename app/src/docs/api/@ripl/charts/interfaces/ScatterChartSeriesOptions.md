[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / ScatterChartSeriesOptions

# Interface: ScatterChartSeriesOptions\<TData\>

Defined in: [charts/src/charts/scatter.ts:70](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L70)

Configuration for an individual scatter chart series.

## Type Parameters

| Type Parameter |
| ------ |
| `TData` |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-color"></a> `color?` | `string` | [charts/src/charts/scatter.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L72) |
| <a id="property-id"></a> `id` | `string` | [charts/src/charts/scatter.ts:71](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L71) |
| <a id="property-label"></a> `label` | `string` \| (`item`) => `string` | [charts/src/charts/scatter.ts:76](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L76) |
| <a id="property-maxradius"></a> `maxRadius?` | `number` | [charts/src/charts/scatter.ts:78](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L78) |
| <a id="property-minradius"></a> `minRadius?` | `number` | [charts/src/charts/scatter.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L77) |
| <a id="property-sizeby"></a> `sizeBy?` | `number` \| keyof `TData` \| (`item`) => `number` | [charts/src/charts/scatter.ts:75](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L75) |
| <a id="property-xby"></a> `xBy` | keyof `TData` \| (`item`) => `number` | [charts/src/charts/scatter.ts:73](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L73) |
| <a id="property-yby"></a> `yBy` | keyof `TData` \| (`item`) => `number` | [charts/src/charts/scatter.ts:74](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/scatter.ts#L74) |
