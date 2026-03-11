[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / objectMap

# Function: objectMap()

> **objectMap**\<`TSource`, `TResult`\>(`input`, `iteratee`): `TResult`

Defined in: [collection.ts:172](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L172)

Maps over the enumerable properties of an object, producing a new object with transformed values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TSource` *extends* [`IterableObject`](../type-aliases/IterableObject.md) | - |
| `TResult` *extends* `Record`\<keyof `TSource`, `unknown`\> | `Record`\<keyof `TSource`, `unknown`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `TSource` |
| `iteratee` | [`ObjectIteratee`](../type-aliases/ObjectIteratee.md)\<`Extract`\<keyof `TSource`, `string`\>, `TSource`\[keyof `TSource`\], `unknown`\> |

## Returns

`TResult`
