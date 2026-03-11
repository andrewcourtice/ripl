[Documentation](../../../packages.md) / [@ripl/core](../index.md) / scaleDiscrete

# Function: scaleDiscrete()

> **scaleDiscrete**\<`TDomain`\>(`domain`, `range`): [`Scale`](../interfaces/Scale.md)\<`TDomain`\>

Defined in: [packages/core/src/scales/discrete.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/discrete.ts#L10)

Creates a discrete (ordinal) scale that maps domain values to corresponding range values by index.

## Type Parameters

| Type Parameter |
| ------ |
| `TDomain` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `TDomain`[] |
| `range` | `number`[] |

## Returns

[`Scale`](../interfaces/Scale.md)\<`TDomain`\>
