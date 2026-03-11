[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / objectReduce

# Function: objectReduce()

> **objectReduce**\<`TSource`, `TResult`\>(`input`, `reducer`, `initial`): `TResult`

Defined in: [collection.ts:183](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L183)

Reduces the enumerable properties of an object into a single accumulated value.

## Type Parameters

| Type Parameter |
| ------ |
| `TSource` *extends* [`IterableObject`](../type-aliases/IterableObject.md) |
| `TResult` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `TSource` |
| `reducer` | [`ObjectReducer`](../type-aliases/ObjectReducer.md)\<keyof `TSource`, `TSource`\[keyof `TSource`\], `TResult`\> |
| `initial` | `TResult` |

## Returns

`TResult`
