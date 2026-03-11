[Documentation](../../../packages.md) / [@ripl/core](../index.md) / getExtent

# Function: getExtent()

> **getExtent**\<`TValue`\>(`values`, `accessor`): \[`number`, `number`\]

Defined in: [packages/core/src/math/number.ts:36](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/number.ts#L36)

Computes the `[min, max]` extent of an array using the given numeric accessor.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `values` | `TValue`[] |
| `accessor` | (`value`) => `number` |

## Returns

\[`number`, `number`\]
