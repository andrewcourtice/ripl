[Documentation](../../../packages.md) / [@ripl/core](../index.md) / RendererTransitionOptionsArg

# Type Alias: RendererTransitionOptionsArg\<TElement\>

> **RendererTransitionOptionsArg**\<`TElement`\> = [`RendererTransitionOptions`](../interfaces/RendererTransitionOptions.md)\<`TElement`\> \| (`element`, `index`, `length`) => [`RendererTransitionOptions`](../interfaces/RendererTransitionOptions.md)\<`TElement`\>

Defined in: [packages/core/src/core/renderer.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L121)

Transition options can be a static object or a per-element factory function.

## Type Parameters

| Type Parameter |
| ------ |
| `TElement` *extends* [`Element`](../classes/Element.md) |
