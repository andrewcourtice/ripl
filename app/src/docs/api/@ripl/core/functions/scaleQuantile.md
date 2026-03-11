[Documentation](../../../packages.md) / [@ripl/core](../index.md) / scaleQuantile

# Function: scaleQuantile()

> **scaleQuantile**\<`TRange`\>(`domain`, `range`): [`Scale`](../interfaces/Scale.md)\<`number`, `TRange`\>

Defined in: [packages/core/src/scales/quantile.ts:15](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/quantile.ts#L15)

Creates a quantile scale that divides a sorted numeric domain into quantiles mapped to discrete range values.

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
