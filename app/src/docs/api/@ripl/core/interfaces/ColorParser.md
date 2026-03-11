[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ColorParser

# Interface: ColorParser

Defined in: [packages/core/src/color/types.ts:26](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/color/types.ts#L26)

A color parser that can test, parse, and serialise a specific color format.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-pattern"></a> `pattern` | `RegExp` | [packages/core/src/color/types.ts:27](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/color/types.ts#L27) |

## Methods

### parse()

> **parse**(`value`): [`ColorRGBA`](../type-aliases/ColorRGBA.md)

Defined in: [packages/core/src/color/types.ts:28](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/color/types.ts#L28)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

[`ColorRGBA`](../type-aliases/ColorRGBA.md)

***

### serialise()

> **serialise**(...`args`): `string`

Defined in: [packages/core/src/color/types.ts:29](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/color/types.ts#L29)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | [`ColorRGBA`](../type-aliases/ColorRGBA.md) |

#### Returns

`string`
