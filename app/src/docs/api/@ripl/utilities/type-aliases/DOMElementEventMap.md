[Documentation](../../../packages.md) / [@ripl/utilities](../index.md) / DOMElementEventMap

# Type Alias: DOMElementEventMap\<TElement\>

> **DOMElementEventMap**\<`TElement`\> = `TElement` *extends* `MediaQueryList` ? `MediaQueryListEventMap` : `TElement` *extends* `HTMLElement` ? `HTMLElementEventMap` : `TElement` *extends* `Window` ? `WindowEventMap` : `TElement` *extends* `Document` ? `DocumentEventMap` : `Record`\<`string`, `Event`\>

Defined in: [dom.ts:12](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/utilities/src/dom.ts#L12)

Resolves the correct event map for a given DOM element type.

## Type Parameters

| Type Parameter |
| ------ |
| `TElement` |
