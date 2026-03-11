[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / ObjectIteratee

# Type Alias: ObjectIteratee()\<TKey, TValue, TResult\>

> **ObjectIteratee**\<`TKey`, `TValue`, `TResult`\> = (`key`, `value`) => `TResult`

Defined in: [collection.ts:22](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L22)

Callback invoked for each entry in an object, receiving the key and value.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TKey` | - |
| `TValue` | - |
| `TResult` | `void` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `TKey` |
| `value` | `TValue` |

## Returns

`TResult`
