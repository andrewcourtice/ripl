[Documentation](../../../packages.md) / [@ripl/core](../index.md) / RendererTransitionOptions

# Interface: RendererTransitionOptions\<TElement\>

Defined in: [packages/core/src/core/renderer.ts:69](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L69)

Options for scheduling a transition on one or more elements via the renderer.

## Type Parameters

| Type Parameter |
| ------ |
| `TElement` *extends* [`Element`](../classes/Element.md) |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-delay"></a> `delay?` | `number` | [packages/core/src/core/renderer.ts:73](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L73) |
| <a id="property-direction"></a> `direction?` | [`TransitionDirection`](../type-aliases/TransitionDirection.md) | [packages/core/src/core/renderer.ts:74](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L74) |
| <a id="property-duration"></a> `duration?` | `number` | [packages/core/src/core/renderer.ts:70](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L70) |
| <a id="property-ease"></a> `ease?` | [`Ease`](../type-aliases/Ease.md) | [packages/core/src/core/renderer.ts:71](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L71) |
| <a id="property-loop"></a> `loop?` | `boolean` | [packages/core/src/core/renderer.ts:72](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L72) |
| <a id="property-state"></a> `state` | [`ElementInterpolationState`](../type-aliases/ElementInterpolationState.md)\<`TElement` *extends* [`Element`](../classes/Element.md)\<infer TState\> ? `TState` : [`BaseElementState`](../type-aliases/BaseElementState.md)\> | [packages/core/src/core/renderer.ts:75](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L75) |

## Methods

### onComplete()?

> `optional` **onComplete**(`element`): `void`

Defined in: [packages/core/src/core/renderer.ts:76](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L76)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | [`Element`](../classes/Element.md) |

#### Returns

`void`
