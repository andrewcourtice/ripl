[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / ChartAxisItemOptions

# Interface: ChartAxisItemOptions\<TData\>

Defined in: [charts/src/core/options.ts:428](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L428)

Options for a single axis (x or y).

## Extended by

- [`ChartYAxisItemOptions`](ChartYAxisItemOptions.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-font"></a> `font` | `string` | [charts/src/core/options.ts:430](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L430) |
| <a id="property-fontcolor"></a> `fontColor` | `string` | [charts/src/core/options.ts:431](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L431) |
| <a id="property-format"></a> `format?` | [`AxisFormatType`](../type-aliases/AxisFormatType.md) \| (`value`) => `string` | [charts/src/core/options.ts:436](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L436) |
| <a id="property-title"></a> `title?` | `string` | [charts/src/core/options.ts:432](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L432) |
| <a id="property-value"></a> `value?` | keyof `TData` \| (`item`) => `any` | [charts/src/core/options.ts:434](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L434) |
| <a id="property-visible"></a> `visible` | `boolean` | [charts/src/core/options.ts:429](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/core/options.ts#L429) |
