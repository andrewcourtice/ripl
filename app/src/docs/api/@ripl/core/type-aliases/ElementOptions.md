[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ElementOptions

# Type Alias: ElementOptions\<TState\>

> **ElementOptions**\<`TState`\> = `object` & `TState`

Defined in: [packages/core/src/core/element.ts:120](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/element.ts#L120)

Options for constructing an element, combining an optional id, CSS classes, data, pointer events, and initial state.

## Type Declaration

### class?

> `optional` **class**: [`OneOrMore`](../../utilities/type-aliases/OneOrMore.md)\<`string`\>

### data?

> `optional` **data**: `unknown`

### id?

> `optional` **id**: `string`

### pointerEvents?

> `optional` **pointerEvents**: [`ElementPointerEvents`](ElementPointerEvents.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* [`BaseElementState`](BaseElementState.md) | [`BaseElementState`](BaseElementState.md) |
