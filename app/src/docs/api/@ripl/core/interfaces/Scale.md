[Documentation](../../../packages.md) / [@ripl/core](../index.md) / Scale

# Interface: Scale()\<TDomain, TRange\>

Defined in: [packages/core/src/scales/types.ts:5](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L5)

A callable scale with domain, range, inverse mapping, tick generation, and inclusion testing.

## Extended by

- [`BandScale`](BandScale.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDomain` | `number` |
| `TRange` | `number` |

> **Scale**(`value`): `TRange`

Defined in: [packages/core/src/scales/types.ts:6](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L6)

A callable scale with domain, range, inverse mapping, tick generation, and inclusion testing.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TDomain` |

## Returns

`TRange`

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-domain"></a> `domain` | `TDomain`[] | [packages/core/src/scales/types.ts:7](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L7) |
| <a id="property-inverse"></a> `inverse` | [`ScaleMethod`](../type-aliases/ScaleMethod.md)\<`TRange`, `TDomain`\> | [packages/core/src/scales/types.ts:9](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L9) |
| <a id="property-range"></a> `range` | `TRange`[] | [packages/core/src/scales/types.ts:8](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L8) |

## Methods

### includes()

> **includes**(`value`): `boolean`

Defined in: [packages/core/src/scales/types.ts:11](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L11)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TDomain` |

#### Returns

`boolean`

***

### ticks()

> **ticks**(`count?`): `TDomain`[]

Defined in: [packages/core/src/scales/types.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L10)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `count?` | `number` |

#### Returns

`TDomain`[]
