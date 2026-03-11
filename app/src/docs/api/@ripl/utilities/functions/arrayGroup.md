[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / arrayGroup

# Function: arrayGroup()

> **arrayGroup**\<`TValue`\>(`input`, `identity`): `Record`\<`PropertyKey`, `TValue`[]\>

Defined in: [collection.ts:108](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/collection.ts#L108)

Groups array items by a property key or indexer function into a keyed record.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `TValue`[] |
| `identity` | [`ArrayGroupIdentity`](../type-aliases/ArrayGroupIdentity.md)\<`TValue`\> |

## Returns

`Record`\<`PropertyKey`, `TValue`[]\>
