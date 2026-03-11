[Documentation](../../../packages.md) / [@ripl/core](../index.md) / InterpolatorFactory

# Type Alias: InterpolatorFactory\<TOut, TIn\>

> **InterpolatorFactory**\<`TOut`, `TIn`\> = (`valueA`, `valueB`) => [`Interpolator`](Interpolator.md)\<`TOut`\> & [`PredicatedFunction`](PredicatedFunction.md)

Defined in: [packages/core/src/interpolators/types.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/interpolators/types.ts#L10)

A factory that creates an interpolator between two values of the same type, with a `test` predicate for type matching.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOut` | `number` |
| `TIn` | `TOut` |
