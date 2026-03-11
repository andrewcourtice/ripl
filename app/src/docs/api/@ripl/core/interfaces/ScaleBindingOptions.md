[Documentation](../../../packages.md) / [@ripl/core](../index.md) / ScaleBindingOptions

# Interface: ScaleBindingOptions\<TDomain, TRange\>

Defined in: [packages/core/src/scales/\_base/index.ts:20](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/_base/index.ts#L20)

Low-level options for constructing a scale, providing conversion, inversion, inclusion, and tick generation callbacks.

## Type Parameters

| Type Parameter |
| ------ |
| `TDomain` |
| `TRange` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-convert"></a> `convert` | `public` | [`ScaleMethod`](../type-aliases/ScaleMethod.md)\<`TDomain`, `TRange`\> | [packages/core/src/scales/\_base/index.ts:23](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/_base/index.ts#L23) |
| <a id="property-domain"></a> `domain` | `readonly` | `TDomain`[] | [packages/core/src/scales/\_base/index.ts:21](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/_base/index.ts#L21) |
| <a id="property-invert"></a> `invert` | `public` | [`ScaleMethod`](../type-aliases/ScaleMethod.md)\<`TRange`, `TDomain`\> | [packages/core/src/scales/\_base/index.ts:24](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/_base/index.ts#L24) |
| <a id="property-range"></a> `range` | `readonly` | `TRange`[] | [packages/core/src/scales/\_base/index.ts:22](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/_base/index.ts#L22) |

## Methods

### includes()?

> `optional` **includes**(`value`): `boolean`

Defined in: [packages/core/src/scales/\_base/index.ts:25](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/_base/index.ts#L25)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TDomain` |

#### Returns

`boolean`

***

### ticks()?

> `optional` **ticks**(`count?`): `TDomain`[]

Defined in: [packages/core/src/scales/\_base/index.ts:26](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/_base/index.ts#L26)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `count?` | `number` |

#### Returns

`TDomain`[]
