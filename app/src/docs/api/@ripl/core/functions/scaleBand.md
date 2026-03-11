[Documentation](../../../packages.md) / [@ripl/core](../index.md) / scaleBand

# Function: scaleBand()

> **scaleBand**\<`TDomain`\>(`domain`, `range`, `options?`): [`BandScale`](../interfaces/BandScale.md)\<`TDomain`\>

Defined in: [packages/core/src/scales/band.ts:27](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/band.ts#L27)

Creates a band scale that maps discrete domain values to evenly spaced bands within the range.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDomain` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `TDomain`[] |
| `range` | `number`[] |
| `options?` | [`BandScaleOptions`](../type-aliases/BandScaleOptions.md) |

## Returns

[`BandScale`](../interfaces/BandScale.md)\<`TDomain`\>
