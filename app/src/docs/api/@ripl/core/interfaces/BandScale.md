[Documentation](../../../packages.md) / [@ripl/core](../index.md) / BandScale

# Interface: BandScale()\<TDomain\>

Defined in: [packages/core/src/scales/band.ts:14](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/band.ts#L14)

A band scale that divides a continuous range into uniform bands for categorical data, exposing bandwidth and step.

## Extends

- [`Scale`](Scale.md)\<`TDomain`, `number`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDomain` | `string` |

> **BandScale**(`value`): `number`

Defined in: [packages/core/src/scales/band.ts:14](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/band.ts#L14)

A band scale that divides a continuous range into uniform bands for categorical data, exposing bandwidth and step.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TDomain` |

## Returns

`number`

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-bandwidth"></a> `bandwidth` | `number` | - | [packages/core/src/scales/band.ts:15](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/band.ts#L15) |
| <a id="property-domain"></a> `domain` | `TDomain`[] | [`Scale`](Scale.md).[`domain`](Scale.md#property-domain) | [packages/core/src/scales/types.ts:7](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L7) |
| <a id="property-inverse"></a> `inverse` | [`ScaleMethod`](../type-aliases/ScaleMethod.md)\<`number`, `TDomain`\> | [`Scale`](Scale.md).[`inverse`](Scale.md#property-inverse) | [packages/core/src/scales/types.ts:9](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L9) |
| <a id="property-range"></a> `range` | `number`[] | [`Scale`](Scale.md).[`range`](Scale.md#property-range) | [packages/core/src/scales/types.ts:8](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/types.ts#L8) |
| <a id="property-step"></a> `step` | `number` | - | [packages/core/src/scales/band.ts:16](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/scales/band.ts#L16) |

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

#### Inherited from

[`Scale`](Scale.md).[`includes`](Scale.md#includes)

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

#### Inherited from

[`Scale`](Scale.md).[`ticks`](Scale.md#ticks)
