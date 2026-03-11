[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / onDOMEvent

# Function: onDOMEvent()

> **onDOMEvent**\<`TElement`, `TEvent`\>(`element`, `event`, `handler`): [`Disposable`](../interfaces/Disposable.md)

Defined in: [dom.ts:28](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/dom.ts#L28)

Attaches a strongly-typed event listener to a DOM element and returns a disposable for cleanup.

## Type Parameters

| Type Parameter |
| ------ |
| `TElement` *extends* `EventTarget` |
| `TEvent` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | `TElement` |
| `event` | `TEvent` |
| `handler` | [`DOMEventHandler`](../type-aliases/DOMEventHandler.md)\<`TElement`, `TEvent`\> |

## Returns

[`Disposable`](../interfaces/Disposable.md)
