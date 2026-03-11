[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / onDOMElementResize

# Function: onDOMElementResize()

> **onDOMElementResize**(`element`, `handler`): [`Disposable`](../interfaces/Disposable.md)

Defined in: [dom.ts:37](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/dom.ts#L37)

Observes an element for size changes using `ResizeObserver` (with a `window.resize` fallback) and returns a disposable.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | `HTMLElement` |
| `handler` | [`DOMElementResizeHandler`](../type-aliases/DOMElementResizeHandler.md) |

## Returns

[`Disposable`](../interfaces/Disposable.md)
