[Documentation](../../../packages.md) / [@ripl/core](../index.md) / RendererOptions

# Interface: RendererOptions

Defined in: [packages/core/src/core/renderer.ts:87](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L87)

Configuration for the renderer, controlling auto-start/stop behaviour and debug overlays.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-autostart"></a> `autoStart?` | `boolean` | [packages/core/src/core/renderer.ts:88](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L88) |
| <a id="property-autostop"></a> `autoStop?` | `boolean` | [packages/core/src/core/renderer.ts:89](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L89) |
| <a id="property-debug"></a> `debug?` | `boolean` \| [`RendererDebugOptions`](RendererDebugOptions.md) | [packages/core/src/core/renderer.ts:92](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L92) |
| <a id="property-immediate"></a> `immediate?` | `boolean` | [packages/core/src/core/renderer.ts:90](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L90) |
| <a id="property-sortbuffer"></a> `sortBuffer?` | (`buffer`) => [`Element`](../classes/Element.md)\<`Partial`\<[`BaseState`](BaseState.md)\>, [`ElementEventMap`](ElementEventMap.md)\>[] | [packages/core/src/core/renderer.ts:91](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/renderer.ts#L91) |
