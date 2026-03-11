[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / objectForEach

# Function: objectForEach()

> **objectForEach**\<`TSource`\>(`input`, `iteratee`): `void`

Defined in: [collection.ts:165](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L165)

Iterates over the enumerable properties of an object, invoking the iteratee for each key-value pair.

## Type Parameters

| Type Parameter |
| ------ |
| `TSource` *extends* [`IterableObject`](../type-aliases/IterableObject.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `TSource` |
| `iteratee` | [`ObjectIteratee`](../type-aliases/ObjectIteratee.md)\<keyof `TSource`, `TSource`\[keyof `TSource`\]\> |

## Returns

`void`
