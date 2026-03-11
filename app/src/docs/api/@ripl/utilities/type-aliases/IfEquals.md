[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / IfEquals

# Type Alias: IfEquals\<X, Y, A, B\>

> **IfEquals**\<`X`, `Y`, `A`, `B`\> = \<`TValue`\>() => `TValue` *extends* `X` ? `1` : `2` *extends* \<`TValue`\>() => `TValue` *extends* `Y` ? `1` : `2` ? `A` : `B`

Defined in: [types.ts:29](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/types.ts#L29)

Conditional type that resolves to `A` if `X` and `Y` are identical, otherwise `B`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `X` | - |
| `Y` | - |
| `A` | `X` |
| `B` | `never` |
