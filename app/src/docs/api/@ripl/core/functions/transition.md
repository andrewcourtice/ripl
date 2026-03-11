[Documentation](../../../packages.md) / [@ripl/core](../index.md) / transition

# Function: transition()

> **transition**(`callback`, `options?`): [`Transition`](../classes/Transition.md)

Defined in: [packages/core/src/animation/transition.ts:36](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/animation/transition.ts#L36)

Creates and starts a frame-driven transition that invokes the callback with the eased time on each animation frame.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `callback` | [`TransitionCallback`](../type-aliases/TransitionCallback.md) |
| `options?` | `Partial`\<[`TransitionOptions`](../interfaces/TransitionOptions.md)\> |

## Returns

[`Transition`](../classes/Transition.md)
