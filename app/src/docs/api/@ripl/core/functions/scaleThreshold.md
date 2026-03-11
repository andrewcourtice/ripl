[Documentation](../../../packages.md) / [@ripl/core](../index.md) / scaleThreshold

# Function: scaleThreshold()

> **scaleThreshold**\<`TRange`\>(`domain`, `range`): [`Scale`](../interfaces/Scale.md)\<`number`, `TRange`\>

Defined in: [packages/core/src/scales/threshold.ts:11](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/threshold.ts#L11)

Creates a threshold scale that maps numeric values to range values based on a set of threshold breakpoints.

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
