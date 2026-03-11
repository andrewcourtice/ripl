[Documentation](../../../packages.md) / [@ripl/core](../index.md) / interpolateString

# Function: interpolateString()

> **interpolateString**(`callback`, `formatter?`): [`Interpolator`](../type-aliases/Interpolator.md)\<`string`\>

Defined in: [packages/core/src/interpolators/string.ts:30](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/interpolators/string.ts#L30)

Creates a string interpolator by interpolating between numeric values embedded in tagged template literals.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `callback` | (`tag`) => [`StringInterpolationSet`](../type-aliases/StringInterpolationSet.md) |
| `formatter?` | [`StringInterpolationFormatter`](../type-aliases/StringInterpolationFormatter.md) |

## Returns

[`Interpolator`](../type-aliases/Interpolator.md)\<`string`\>
