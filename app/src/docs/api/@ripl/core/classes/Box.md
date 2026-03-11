[Documentation](../../../packages.md) / [@ripl/core](../index.md) / Box

# Class: Box

Defined in: [packages/core/src/math/structs.ts:2](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/structs.ts#L2)

An axis-aligned bounding box defined by its four edges.

## Constructors

### Constructor

> **new Box**(`top`, `left`, `bottom`, `right`): `Box`

Defined in: [packages/core/src/math/structs.ts:4](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/structs.ts#L4)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `top` | `number` |
| `left` | `number` |
| `bottom` | `number` |
| `right` | `number` |

#### Returns

`Box`

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-bottom"></a> `bottom` | `public` | `number` | [packages/core/src/math/structs.ts:7](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/structs.ts#L7) |
| <a id="property-left"></a> `left` | `public` | `number` | [packages/core/src/math/structs.ts:6](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/structs.ts#L6) |
| <a id="property-right"></a> `right` | `public` | `number` | [packages/core/src/math/structs.ts:8](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/structs.ts#L8) |
| <a id="property-top"></a> `top` | `public` | `number` | [packages/core/src/math/structs.ts:5](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/structs.ts#L5) |

## Accessors

### height

#### Get Signature

> **get** **height**(): `number`

Defined in: [packages/core/src/math/structs.ts:22](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/structs.ts#L22)

The vertical span of the box.

##### Returns

`number`

***

### width

#### Get Signature

> **get** **width**(): `number`

Defined in: [packages/core/src/math/structs.ts:17](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/structs.ts#L17)

The horizontal span of the box.

##### Returns

`number`

## Methods

### empty()

> `static` **empty**(): `Box`

Defined in: [packages/core/src/math/structs.ts:12](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/math/structs.ts#L12)

Creates a zero-sized box at the origin.

#### Returns

`Box`
