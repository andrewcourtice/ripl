[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / setFlatMap

# Function: setFlatMap()

> **setFlatMap**\<`TValue`, `TResult`\>(`input`, `iteratee`): `Set`\<`TResult`\>

Defined in: [collection.ts:240](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L240)

Flat-maps over a `Set`, concatenating the arrays returned by the iteratee into a new `Set`.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` |
| `TResult` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `Set`\<`TValue`\> |
| `iteratee` | [`CollectionIteratee`](../type-aliases/CollectionIteratee.md)\<`TValue`, `TResult`[]\> |

## Returns

`Set`\<`TResult`\>
