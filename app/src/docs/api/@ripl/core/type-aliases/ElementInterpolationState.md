[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ElementInterpolationState

# Type Alias: ElementInterpolationState\<TState\>

> **ElementInterpolationState**\<`TState`\> = `{ [TKey in keyof TState]?: ElementInterpolationStateValue<TState[TKey]> }`

Defined in: [packages/core/src/core/element.ts:144](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L144)

Partial state where each property can be a target value, keyframe array, or interpolator function.

## Type Parameters

| Type Parameter |
| ------ |
| `TState` *extends* [`BaseElementState`](BaseElementState.md) |
