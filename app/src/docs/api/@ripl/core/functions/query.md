[Documentation](../../../packages.md) / [@ripl/core](../index.md) / query

# Function: query()

> **query**\<`TElement`\>(`elements`, `selector`): `TElement` \| `undefined`

Defined in: [packages/core/src/core/group.ts:149](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L149)

Returns the first element matching a CSS-like selector, or `undefined` if none match.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TElement` *extends* [`Element`](../classes/Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> | [`Element`](../classes/Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `elements` | [`OneOrMore`](../../utilities/type-aliases/OneOrMore.md)\<[`Element`](../classes/Element.md)\<`Partial`\<[`BaseState`](../interfaces/BaseState.md)\>, [`ElementEventMap`](../interfaces/ElementEventMap.md)\> \| [`Group`](../classes/Group.md)\<[`ElementEventMap`](../interfaces/ElementEventMap.md)\>\> |
| `selector` | `string` |

## Returns

`TElement` \| `undefined`
