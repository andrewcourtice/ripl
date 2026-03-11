[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / arrayJoin

# Function: arrayJoin()

> **arrayJoin**\<`TLeft`, `TRight`\>(`leftInput`, `rightInput`, `predicate`): [`ArrayJoin`](../interfaces/ArrayJoin.md)\<`TLeft`, `TRight`\>

Defined in: [collection.ts:101](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L101)

Performs a full join between two arrays, returning entries (left-only), updates (matched), and exits (right-only).

## Type Parameters

| Type Parameter |
| ------ |
| `TLeft` |
| `TRight` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `leftInput` | `TLeft`[] |
| `rightInput` | `TRight`[] |
| `predicate` | [`ArrayJoinPredicate`](../type-aliases/ArrayJoinPredicate.md)\<`TLeft`, `TRight`\> |

## Returns

[`ArrayJoin`](../interfaces/ArrayJoin.md)\<`TLeft`, `TRight`\>
