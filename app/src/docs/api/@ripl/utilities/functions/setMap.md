[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / setMap

# Function: setMap()

> **setMap**\<`TValue`, `TResult`\>(`input`, `iteratee`): `Set`\<`TResult`\>

Defined in: [collection.ts:203](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L203)

Maps over a `Set`, producing a new `Set` with each value transformed by the iteratee.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` |
| `TResult` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `Set`\<`TValue`\> |
| `iteratee` | [`CollectionIteratee`](../type-aliases/CollectionIteratee.md)\<`TValue`, `TResult`\> |

## Returns

`Set`\<`TResult`\>
