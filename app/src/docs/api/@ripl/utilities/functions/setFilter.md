[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / setFilter

# Function: setFilter()

> **setFilter**\<`TValue`\>(`input`, `predicate`): `Set`\<`TValue`\>

Defined in: [collection.ts:215](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L215)

Filters a `Set`, returning a new `Set` containing only values that satisfy the predicate.

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

`Set`\<`TValue`\>
