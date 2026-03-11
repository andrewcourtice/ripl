[Documentation](../../../packages.md) / [@ripl/core](../index.md) / EventMap

# Type Alias: EventMap

> **EventMap** = `object`

Defined in: [packages/core/src/core/event-bus.ts:11](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L11)

Base event map interface; all custom event maps should extend this.

## Extended by

- [`ContextEventMap`](../interfaces/ContextEventMap.md)
- [`ElementEventMap`](../interfaces/ElementEventMap.md)
- [`RendererEventMap`](../interfaces/RendererEventMap.md)

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

### destroyed

> **destroyed**: `null`

Defined in: [packages/core/src/core/event-bus.ts:13](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L13)
