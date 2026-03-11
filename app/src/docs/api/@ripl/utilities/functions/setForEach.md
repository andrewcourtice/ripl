[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / setForEach

# Function: setForEach()

> **setForEach**\<`TValue`\>(`input`, `iteratee`): `void`

Defined in: [collection.ts:194](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L194)

Iterates over each value in a `Set`, invoking the iteratee with the value and a running index.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `Set`\<`TValue`\> |
| `iteratee` | [`CollectionIteratee`](../type-aliases/CollectionIteratee.md)\<`TValue`\> |

## Returns

`void`
