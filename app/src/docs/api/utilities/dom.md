---
outline: "deep"
---

# DOM

<p class="api-package-badge"><code>@ripl/utilities</code></p>

DOM element creation and query utilities.

## Overview

**Interfaces:** [`DOMElementResizeEvent`](#domelementresizeevent)

**Type Aliases:** [`DOMEventHandler`](#domeventhandler) · [`DOMElementResizeHandler`](#domelementresizehandler) · [`DOMElementEventMap`](#domelementeventmap)

**Functions:** [`onDOMEvent`](#ondomevent) · [`onDOMElementResize`](#ondomelementresize)

**Constants:** [`hasWindow`](#haswindow)

### DOMElementResizeEvent `interface`

Simplified resize event containing the new dimensions of the observed element.

```ts
interface DOMElementResizeEvent {
    width: number;
    height: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `width` | `number` |  |
| `height` | `number` |  |
---

### DOMEventHandler `type`

A strongly-typed DOM event handler bound to a specific element and event type.

```ts
type DOMEventHandler<TElement, TEvent extends keyof DOMElementEventMap<TElement>> = (this: TElement, event: DOMElementEventMap<TElement>[TEvent]) => void;
```

---

### DOMElementResizeHandler `type`

Callback invoked when an observed element is resized.

```ts
type DOMElementResizeHandler = (event: DOMElementResizeEvent) => void;
```

---

### DOMElementEventMap `type`

Resolves the correct event map for a given DOM element type.

```ts
type DOMElementEventMap<TElement> = TElement extends MediaQueryList ? MediaQueryListEventMap
    : TElement extends HTMLElement ? HTMLElementEventMap
        : TElement extends Window ? WindowEventMap
            : TElement extends Document ? DocumentEventMap
                : Record<string, Event>;
```

---

### onDOMEvent `function`

Attaches a strongly-typed event listener to a DOM element and returns a disposable for cleanup.

```ts
function onDOMEvent<TElement extends EventTarget, TEvent extends string & keyof DOMElementEventMap<TElement>>(element: TElement, event: TEvent, handler: DOMEventHandler<TElement, TEvent>): Disposable
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `TElement` |  |
| `event` | `TEvent` |  |
| `handler` | `DOMEventHandler&lt;TElement, TEvent&gt;` |  |

**Returns:** `Disposable`

---

### onDOMElementResize `function`

Observes an element for size changes using `ResizeObserver` (with a `window.resize` fallback) and returns a disposable.

```ts
function onDOMElementResize(element: HTMLElement, handler: DOMElementResizeHandler): Disposable
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `element` | `HTMLElement` |  |
| `handler` | `DOMElementResizeHandler` |  |

**Returns:** `Disposable`

---

### hasWindow `const`

Whether the current environment has a `window` object (i.e. is a browser context).

```ts
const hasWindow: boolean
```

---

