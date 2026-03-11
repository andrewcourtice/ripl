[Documentation](../../../packages.md) / [@ripl/core](../index.md) / RendererEventMap

# Interface: RendererEventMap

Defined in: [packages/core/src/core/renderer.ts:43](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L43)

Event map for the renderer, with start, stop, and per-frame tick events.

## Extends

- [`EventMap`](../type-aliases/EventMap.md)

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-destroyed"></a> `destroyed` | `null` | `EventMap.destroyed` | [packages/core/src/core/event-bus.ts:13](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L13) |
| <a id="property-start"></a> `start` | `object` | - | [packages/core/src/core/renderer.ts:44](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L44) |
| `start.startTime` | `number` | - | [packages/core/src/core/renderer.ts:45](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L45) |
| <a id="property-stop"></a> `stop` | `object` | - | [packages/core/src/core/renderer.ts:47](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L47) |
| `stop.endTime` | `number` | - | [packages/core/src/core/renderer.ts:49](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L49) |
| `stop.startTime` | `number` | - | [packages/core/src/core/renderer.ts:48](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L48) |
| <a id="property-tick"></a> `tick` | `object` | - | [packages/core/src/core/renderer.ts:51](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L51) |
| `tick.deltaTime` | `number` | - | [packages/core/src/core/renderer.ts:53](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L53) |
| `tick.time` | `number` | - | [packages/core/src/core/renderer.ts:52](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L52) |
