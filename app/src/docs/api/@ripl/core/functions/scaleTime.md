[Documentation](../../../packages.md) / [@ripl/core](../index.md) / scaleTime

# Function: scaleTime()

> **scaleTime**(`domain`, `range`, `options?`): [`Scale`](../interfaces/Scale.md)\<`Date`, `number`\>

Defined in: [packages/core/src/scales/time.ts:16](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/time.ts#L16)

Creates a time scale that maps a `Date` domain to a numeric range using linear interpolation of timestamps.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `Date`[] |
| `range` | `number`[] |
| `options?` | [`LinearScaleOptions`](../interfaces/LinearScaleOptions.md) |

## Returns

[`Scale`](../interfaces/Scale.md)\<`Date`, `number`\>
