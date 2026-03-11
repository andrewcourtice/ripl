[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / CachedFunction

# Type Alias: CachedFunction()\<TValue\>

> **CachedFunction**\<`TValue`\> = `ReturnType`\<`TValue`\>

Defined in: [function.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/function.ts#L10)

A function wrapper that caches its result after the first invocation until explicitly invalidated.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` *extends* [`AnyFunction`](AnyFunction.md) |

> **CachedFunction**(...`args`): `ReturnType`\<`TValue`\>

A function wrapper that caches its result after the first invocation until explicitly invalidated.

## Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `Parameters`\<`TValue`\> |

## Returns

`ReturnType`\<`TValue`\>

## Methods

### invalidate()

> **invalidate**(): `void`

Defined in: [function.ts:12](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/function.ts#L12)

#### Returns

`void`
