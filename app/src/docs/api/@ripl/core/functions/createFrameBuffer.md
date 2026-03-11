[Documentation](../../../packages.md) / [@ripl/core](../index.md) / createFrameBuffer

# Function: createFrameBuffer()

> **createFrameBuffer**(): (`callback`) => `void`

Defined in: [packages/core/src/animation/utilities.ts:6](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/animation/utilities.ts#L6)

Creates a debounced `requestAnimationFrame` wrapper that cancels any pending frame before scheduling a new one.

## Returns

> (`callback`): `void`

### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback` | [`AnyFunction`](../../utilities/type-aliases/AnyFunction.md) |

### Returns

`void`
