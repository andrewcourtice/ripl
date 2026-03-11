[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / arrayIntersection

# Function: arrayIntersection()

> **arrayIntersection**\<`TLeft`, `TRight`\>(`leftInput`, `rightInput`, `predicate?`): `TLeft`[]

Defined in: [collection.ts:155](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L155)

Returns items from the left array that have a matching counterpart in the right array.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TLeft` | - |
| `TRight` | `TLeft` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `leftInput` | `TLeft`[] |
| `rightInput` | `TRight`[] |
| `predicate?` | [`ArrayJoinPredicate`](../type-aliases/ArrayJoinPredicate.md)\<`TLeft`, `TRight`\> |

## Returns

`TLeft`[]
