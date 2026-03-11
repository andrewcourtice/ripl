[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ElementInterpolators

# Type Alias: ElementInterpolators\<TState\>

> **ElementInterpolators**\<`TState`\> = `{ [TKey in keyof TState]: InterpolatorFactory<TState[TKey]> }`

Defined in: [packages/core/src/core/element.ts:139](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L139)

A map of interpolator factories keyed by state property, used to override default interpolation behaviour.

## Type Parameters

| Type Parameter |
| ------ |
| `TState` *extends* [`BaseElementState`](BaseElementState.md) |
