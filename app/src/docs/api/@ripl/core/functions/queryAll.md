[Documentation](../../../packages.md) / [@ripl/core](../index.md) / queryAll

# Function: queryAll()

> **queryAll**\<`TElement`\>(`elements`, `selector`): `TElement`[]

Defined in: [packages/core/src/core/group.ts:140](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/group.ts#L140)

Queries all elements matching a CSS-like selector across the given element(s) and their descendants.

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

`TElement`[]
