[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / functionMemoize

# Function: functionMemoize()

> **functionMemoize**\<`TValue`, `TKey`\>(`value`, `resolver?`): [`MemoizedFunction`](../type-aliases/MemoizedFunction.md)\<`TValue`, `TKey`\>

Defined in: [function.ts:55](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/function.ts#L55)

Memoizes a function by caching results keyed by the resolver (defaults to the first argument).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` *extends* [`AnyFunction`](../type-aliases/AnyFunction.md) | - |
| `TKey` | `Parameters`\<`TValue`\>\[`0`\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TValue` |
| `resolver` | [`MemoizeResolver`](../type-aliases/MemoizeResolver.md)\<`TValue`, `TKey`\> |

## Returns

[`MemoizedFunction`](../type-aliases/MemoizedFunction.md)\<`TValue`, `TKey`\>
