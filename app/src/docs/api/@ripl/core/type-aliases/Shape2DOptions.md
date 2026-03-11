[Documentation](../../../packages.md) / [@ripl/core](../index.md) / Shape2DOptions

# Type Alias: Shape2DOptions\<TState\>

> **Shape2DOptions**\<`TState`\> = [`ElementOptions`](ElementOptions.md)\<`TState`\> & `object`

Defined in: [packages/core/src/core/shape.ts:23](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/shape.ts#L23)

Options for a 2D shape, adding automatic fill/stroke and clipping controls.

## Type Declaration

### autoFill?

> `optional` **autoFill**: `boolean`

### autoStroke?

> `optional` **autoStroke**: `boolean`

### clip?

> `optional` **clip**: `boolean`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* [`BaseElementState`](BaseElementState.md) | [`BaseElementState`](BaseElementState.md) |
