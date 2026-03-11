[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ElementInterpolationStateValue

# Type Alias: ElementInterpolationStateValue\<TValue\>

> **ElementInterpolationStateValue**\<`TValue`\> = `TValue` \| [`ElementInterpolationKeyFrame`](ElementInterpolationKeyFrame.md)\<`TValue`\>[] \| [`Interpolator`](Interpolator.md)\<`TValue`\>

Defined in: [packages/core/src/core/element.ts:134](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L134)

An interpolation target: a direct value, an array of keyframes, or a custom interpolator function.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `number` |
