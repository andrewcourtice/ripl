[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / LineChartSeriesOptions

# Interface: LineChartSeriesOptions\<TData\>

Defined in: [charts/src/charts/line.ts:75](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L75)

Configuration for an individual line chart series.

## Type Parameters

| Type Parameter |
| ------ |
| `TData` |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-color"></a> `color?` | `string` | [charts/src/charts/line.ts:77](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L77) |
| <a id="property-id"></a> `id` | `string` | [charts/src/charts/line.ts:76](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L76) |
| <a id="property-label"></a> `label` | `string` \| (`item`) => `string` | [charts/src/charts/line.ts:79](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L79) |
| <a id="property-linetype"></a> `lineType?` | [`PolylineRenderer`](../../core/type-aliases/PolylineRenderer.md) | [charts/src/charts/line.ts:80](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L80) |
| <a id="property-linewidth"></a> `lineWidth?` | `number` | [charts/src/charts/line.ts:81](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L81) |
| <a id="property-markerradius"></a> `markerRadius?` | `number` | [charts/src/charts/line.ts:83](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L83) |
| <a id="property-markers"></a> `markers?` | `boolean` | [charts/src/charts/line.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L82) |
| <a id="property-value"></a> `value` | `number` \| keyof `TData` \| (`item`) => `number` | [charts/src/charts/line.ts:78](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/charts/line.ts#L78) |
