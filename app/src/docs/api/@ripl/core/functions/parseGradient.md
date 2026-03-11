[Documentation](../../../packages.md) / [@ripl/core](../index.md) / parseGradient

# Function: parseGradient()

> **parseGradient**(`value`): [`Gradient`](../type-aliases/Gradient.md) \| `undefined`

Defined in: [packages/core/src/gradient/parser.ts:233](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/gradient/parser.ts#L233)

Parses a CSS gradient string (linear, radial, or conic) into a structured `Gradient` object, or returns `undefined` if the string is not a recognised gradient.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

## Returns

[`Gradient`](../type-aliases/Gradient.md) \| `undefined`
