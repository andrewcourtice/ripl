[Documentation](../../../packages.md) / [@ripl/core](../index.md) / getLinearScaleMethod

# Function: getLinearScaleMethod()

> **getLinearScaleMethod**(`domain`, `range`, `options?`): [`ScaleMethod`](../type-aliases/ScaleMethod.md)

Defined in: [packages/core/src/scales/\_base/index.ts:78](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/_base/index.ts#L78)

Creates a linear mapping function from a numeric domain to a numeric range, with optional clamping and tick-padding.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `number`[] |
| `range` | `number`[] |
| `options?` | [`LinearScaleOptions`](../interfaces/LinearScaleOptions.md) |

## Returns

[`ScaleMethod`](../type-aliases/ScaleMethod.md)
