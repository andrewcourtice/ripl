[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / ObjectReducer

# Type Alias: ObjectReducer()\<TKey, TValue, TResult\>

> **ObjectReducer**\<`TKey`, `TValue`, `TResult`\> = (`accumulator`, `key`, `value`) => `TResult`

Defined in: [collection.ts:25](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L25)

Reducer callback for folding over object entries into an accumulated result.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TKey` | - |
| `TValue` | - |
| `TResult` | `void` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `accumulator` | `TResult` |
| `key` | `TKey` |
| `value` | `TValue` |

## Returns

`TResult`
