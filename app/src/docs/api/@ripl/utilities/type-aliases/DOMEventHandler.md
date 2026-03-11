[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / DOMEventHandler

# Type Alias: DOMEventHandler()\<TElement, TEvent\>

> **DOMEventHandler**\<`TElement`, `TEvent`\> = (`this`, `event`) => `void`

Defined in: [dom.ts:6](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/dom.ts#L6)

A strongly-typed DOM event handler bound to a specific element and event type.

## Type Parameters

| Type Parameter |
| ------ |
| `TElement` |
| `TEvent` *extends* keyof [`DOMElementEventMap`](DOMElementEventMap.md)\<`TElement`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `this` | `TElement` |
| `event` | [`DOMElementEventMap`](DOMElementEventMap.md)\<`TElement`\>\[`TEvent`\] |

## Returns

`void`
