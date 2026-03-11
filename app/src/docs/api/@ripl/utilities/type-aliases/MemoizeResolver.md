[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / MemoizeResolver

# Type Alias: MemoizeResolver()\<TValue, TKey\>

> **MemoizeResolver**\<`TValue`, `TKey`\> = (...`args`) => `TKey`

Defined in: [function.ts:22](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/function.ts#L22)

Derives a cache key from the arguments of a memoized function.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` *extends* [`AnyFunction`](AnyFunction.md) |
| `TKey` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `Parameters`\<`TValue`\> |

## Returns

`TKey`
