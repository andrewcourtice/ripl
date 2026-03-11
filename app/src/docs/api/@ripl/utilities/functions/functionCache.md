[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / functionCache

# Function: functionCache()

> **functionCache**\<`TValue`\>(`value`): [`CachedFunction`](../type-aliases/CachedFunction.md)\<`TValue`\>

Defined in: [function.ts:35](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/function.ts#L35)

Wraps a function so its result is computed once and then returned from cache on subsequent calls until `invalidate()` is called.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` *extends* [`AnyFunction`](../type-aliases/AnyFunction.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TValue` |

## Returns

[`CachedFunction`](../type-aliases/CachedFunction.md)\<`TValue`\>
