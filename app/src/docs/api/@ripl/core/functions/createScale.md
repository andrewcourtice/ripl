[Documentation](../../../packages.md) / [@ripl/core](../index.md) / createScale

# Function: createScale()

> **createScale**\<`TDomain`, `TRange`\>(`options`): [`Scale`](../interfaces/Scale.md)\<`TDomain`, `TRange`\>

Defined in: [packages/core/src/scales/\_base/index.ts:56](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/_base/index.ts#L56)

Assembles a `Scale` object from explicit conversion, inversion, and tick functions.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDomain` | `number` |
| `TRange` | `number` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ScaleBindingOptions`](../interfaces/ScaleBindingOptions.md)\<`TDomain`, `TRange`\> |

## Returns

[`Scale`](../interfaces/Scale.md)\<`TDomain`, `TRange`\>
