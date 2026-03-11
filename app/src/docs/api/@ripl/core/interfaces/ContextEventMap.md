[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ContextEventMap

# Interface: ContextEventMap

Defined in: [packages/core/src/context/\_base/index.ts:89](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L89)

Event map for a rendering context, including resize and pointer events.

## Extends

- [`EventMap`](../type-aliases/EventMap.md)

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-click"></a> `click` | `object` | - | [packages/core/src/context/\_base/index.ts:97](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L97) |
| `click.x` | `number` | - | [packages/core/src/context/\_base/index.ts:98](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L98) |
| `click.y` | `number` | - | [packages/core/src/context/\_base/index.ts:99](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L99) |
| <a id="property-destroyed"></a> `destroyed` | `null` | `EventMap.destroyed` | [packages/core/src/core/event-bus.ts:13](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/event-bus.ts#L13) |
| <a id="property-drag"></a> `drag` | `object` | - | [packages/core/src/context/\_base/index.ts:105](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L105) |
| `drag.deltaX` | `number` | - | [packages/core/src/context/\_base/index.ts:110](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L110) |
| `drag.deltaY` | `number` | - | [packages/core/src/context/\_base/index.ts:111](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L111) |
| `drag.startX` | `number` | - | [packages/core/src/context/\_base/index.ts:108](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L108) |
| `drag.startY` | `number` | - | [packages/core/src/context/\_base/index.ts:109](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L109) |
| `drag.x` | `number` | - | [packages/core/src/context/\_base/index.ts:106](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L106) |
| `drag.y` | `number` | - | [packages/core/src/context/\_base/index.ts:107](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L107) |
| <a id="property-dragend"></a> `dragend` | `object` | - | [packages/core/src/context/\_base/index.ts:113](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L113) |
| `dragend.deltaX` | `number` | - | [packages/core/src/context/\_base/index.ts:118](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L118) |
| `dragend.deltaY` | `number` | - | [packages/core/src/context/\_base/index.ts:119](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L119) |
| `dragend.startX` | `number` | - | [packages/core/src/context/\_base/index.ts:116](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L116) |
| `dragend.startY` | `number` | - | [packages/core/src/context/\_base/index.ts:117](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L117) |
| `dragend.x` | `number` | - | [packages/core/src/context/\_base/index.ts:114](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L114) |
| `dragend.y` | `number` | - | [packages/core/src/context/\_base/index.ts:115](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L115) |
| <a id="property-dragstart"></a> `dragstart` | `object` | - | [packages/core/src/context/\_base/index.ts:101](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L101) |
| `dragstart.x` | `number` | - | [packages/core/src/context/\_base/index.ts:102](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L102) |
| `dragstart.y` | `number` | - | [packages/core/src/context/\_base/index.ts:103](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L103) |
| <a id="property-mouseenter"></a> `mouseenter` | `null` | - | [packages/core/src/context/\_base/index.ts:91](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L91) |
| <a id="property-mouseleave"></a> `mouseleave` | `null` | - | [packages/core/src/context/\_base/index.ts:92](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L92) |
| <a id="property-mousemove"></a> `mousemove` | `object` | - | [packages/core/src/context/\_base/index.ts:93](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L93) |
| `mousemove.x` | `number` | - | [packages/core/src/context/\_base/index.ts:94](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L94) |
| `mousemove.y` | `number` | - | [packages/core/src/context/\_base/index.ts:95](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L95) |
| <a id="property-resize"></a> `resize` | `null` | - | [packages/core/src/context/\_base/index.ts:90](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L90) |
