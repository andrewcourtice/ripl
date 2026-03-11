[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ElementEventMap

# Interface: ElementEventMap

Defined in: [packages/core/src/core/element.ts:79](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L79)

Event map for elements, extending the base event map with lifecycle and interaction events.

## Extends

- [`EventMap`](../type-aliases/EventMap.md)

## Extended by

- [`SceneEventMap`](SceneEventMap.md)

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

| Property | Type | Overrides | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-attached"></a> `attached` | [`Group`](../classes/Group.md) | - | [packages/core/src/core/element.ts:83](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L83) |
| <a id="property-click"></a> `click` | `object` | - | [packages/core/src/core/element.ts:92](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L92) |
| `click.x` | `number` | - | [packages/core/src/core/element.ts:93](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L93) |
| `click.y` | `number` | - | [packages/core/src/core/element.ts:94](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L94) |
| <a id="property-destroyed"></a> `destroyed` | `null` | `EventMap.destroyed` | [packages/core/src/core/element.ts:116](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L116) |
| <a id="property-detached"></a> `detached` | [`Group`](../classes/Group.md) | - | [packages/core/src/core/element.ts:84](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L84) |
| <a id="property-drag"></a> `drag` | `object` | - | [packages/core/src/core/element.ts:100](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L100) |
| `drag.deltaX` | `number` | - | [packages/core/src/core/element.ts:105](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L105) |
| `drag.deltaY` | `number` | - | [packages/core/src/core/element.ts:106](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L106) |
| `drag.startX` | `number` | - | [packages/core/src/core/element.ts:103](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L103) |
| `drag.startY` | `number` | - | [packages/core/src/core/element.ts:104](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L104) |
| `drag.x` | `number` | - | [packages/core/src/core/element.ts:101](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L101) |
| `drag.y` | `number` | - | [packages/core/src/core/element.ts:102](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L102) |
| <a id="property-dragend"></a> `dragend` | `object` | - | [packages/core/src/core/element.ts:108](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L108) |
| `dragend.deltaX` | `number` | - | [packages/core/src/core/element.ts:113](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L113) |
| `dragend.deltaY` | `number` | - | [packages/core/src/core/element.ts:114](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L114) |
| `dragend.startX` | `number` | - | [packages/core/src/core/element.ts:111](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L111) |
| `dragend.startY` | `number` | - | [packages/core/src/core/element.ts:112](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L112) |
| `dragend.x` | `number` | - | [packages/core/src/core/element.ts:109](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L109) |
| `dragend.y` | `number` | - | [packages/core/src/core/element.ts:110](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L110) |
| <a id="property-dragstart"></a> `dragstart` | `object` | - | [packages/core/src/core/element.ts:96](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L96) |
| `dragstart.x` | `number` | - | [packages/core/src/core/element.ts:97](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L97) |
| `dragstart.y` | `number` | - | [packages/core/src/core/element.ts:98](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L98) |
| <a id="property-graph"></a> `graph` | `null` | - | [packages/core/src/core/element.ts:80](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L80) |
| <a id="property-mouseenter"></a> `mouseenter` | `null` | - | [packages/core/src/core/element.ts:86](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L86) |
| <a id="property-mouseleave"></a> `mouseleave` | `null` | - | [packages/core/src/core/element.ts:87](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L87) |
| <a id="property-mousemove"></a> `mousemove` | `object` | - | [packages/core/src/core/element.ts:88](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L88) |
| `mousemove.x` | `number` | - | [packages/core/src/core/element.ts:89](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L89) |
| `mousemove.y` | `number` | - | [packages/core/src/core/element.ts:90](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L90) |
| <a id="property-track"></a> `track` | keyof `ElementEventMap` | - | [packages/core/src/core/element.ts:81](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L81) |
| <a id="property-untrack"></a> `untrack` | keyof `ElementEventMap` | - | [packages/core/src/core/element.ts:82](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L82) |
| <a id="property-updated"></a> `updated` | `null` | - | [packages/core/src/core/element.ts:85](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L85) |
