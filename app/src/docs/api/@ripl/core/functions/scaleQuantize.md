[Documentation](../../../packages.md) / [@ripl/core](../index.md) / scaleQuantize

# Function: scaleQuantize()

> **scaleQuantize**\<`TRange`\>(`domain`, `range`): [`Scale`](../interfaces/Scale.md)\<`number`, `TRange`\>

Defined in: [packages/core/src/scales/quantize.ts:15](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/quantize.ts#L15)

Creates a quantize scale that divides a continuous numeric domain into uniform segments mapped to discrete range values.

## Type Parameters

| Type Parameter |
| ------ |
| `TRange` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `number`[] |
| `range` | `TRange`[] |

## Returns

[`Scale`](../interfaces/Scale.md)\<`number`, `TRange`\>
