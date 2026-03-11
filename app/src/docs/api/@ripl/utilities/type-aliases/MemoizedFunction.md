[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / MemoizedFunction

# Type Alias: MemoizedFunction()\<TValue, TKey\>

> **MemoizedFunction**\<`TValue`, `TKey`\> = `ReturnType`\<`TValue`\>

Defined in: [function.ts:16](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/function.ts#L16)

A function wrapper that caches results per unique key, exposing the underlying cache `Map`.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` *extends* [`AnyFunction`](AnyFunction.md) |
| `TKey` |

> **MemoizedFunction**(...`args`): `ReturnType`\<`TValue`\>

A function wrapper that caches results per unique key, exposing the underlying cache `Map`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `Parameters`\<`TValue`\> |

## Returns

`ReturnType`\<`TValue`\>

## Properties

### cache

> **cache**: `Map`\<`TKey`, `ReturnType`\<`TValue`\>\>

Defined in: [function.ts:18](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/function.ts#L18)
