[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / setFind

# Function: setFind()

> **setFind**\<`TValue`\>(`input`, `predicate`): `TValue` \| `undefined`

Defined in: [collection.ts:229](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L229)

Searches a `Set` for the first value that satisfies the predicate.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `Set`\<`TValue`\> |
| `predicate` | [`CollectionIteratee`](../type-aliases/CollectionIteratee.md)\<`TValue`, `boolean`\> |

## Returns

`TValue` \| `undefined`
