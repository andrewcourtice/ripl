[Documentation](../../../packages.md) / [@ripl/core](../index.md) / RendererTransition

# Interface: RendererTransition

Defined in: [packages/core/src/core/renderer.ts:58](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L58)

Internal representation of an active transition managed by the renderer.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-direction"></a> `direction` | [`TransitionDirection`](../type-aliases/TransitionDirection.md) | [packages/core/src/core/renderer.ts:63](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L63) |
| <a id="property-duration"></a> `duration` | `number` | [packages/core/src/core/renderer.ts:60](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L60) |
| <a id="property-ease"></a> `ease` | [`Ease`](../type-aliases/Ease.md) | [packages/core/src/core/renderer.ts:61](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L61) |
| <a id="property-interpolator"></a> `interpolator` | [`Interpolator`](../type-aliases/Interpolator.md)\<`void`\> | [packages/core/src/core/renderer.ts:64](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L64) |
| <a id="property-loop"></a> `loop` | `boolean` | [packages/core/src/core/renderer.ts:62](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L62) |
| <a id="property-starttime"></a> `startTime` | `number` | [packages/core/src/core/renderer.ts:59](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L59) |

## Methods

### callback()

> **callback**(): `void`

Defined in: [packages/core/src/core/renderer.ts:65](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L65)

#### Returns

`void`
