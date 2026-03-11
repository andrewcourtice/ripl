[Documentation](../../../packages.md) / [@ripl/core](../index.md) / getContainingBox

# Function: getContainingBox()

> **getContainingBox**\<`TValue`\>(`value`, `identity`): [`Box`](../classes/Box.md)

Defined in: [packages/core/src/math/geometry.ts:83](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/geometry.ts#L83)

Computes the smallest axis-aligned bounding box that contains all boxes extracted from the array.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TValue`[] |
| `identity` | (`value`) => [`Box`](../classes/Box.md) |

## Returns

[`Box`](../classes/Box.md)
