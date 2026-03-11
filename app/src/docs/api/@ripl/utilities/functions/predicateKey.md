[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / predicateKey

# Function: predicateKey()

> **predicateKey**\<`TValue`\>(`valueA`, `valueB`, `key`): `boolean`

Defined in: [predicate.ts:7](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/predicate.ts#L7)

Tests whether two objects share the same value at a given key.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` *extends* `Record`\<`PropertyKey`, `unknown`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `valueA` | `TValue` |
| `valueB` | `TValue` |
| `key` | `PropertyKey` |

## Returns

`boolean`
