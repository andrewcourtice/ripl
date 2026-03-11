[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / CollectionIteratee

# Type Alias: CollectionIteratee()\<TValue, TResult\>

> **CollectionIteratee**\<`TValue`, `TResult`\> = (`value`, `index`) => `TResult`

Defined in: [collection.ts:19](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L19)

Callback invoked for each item in a collection, receiving the value and its index.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | - |
| `TResult` | `void` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TValue` |
| `index` | `number` |

## Returns

`TResult`
