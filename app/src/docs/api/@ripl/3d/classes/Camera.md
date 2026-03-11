[Documentation](../../../packages.md) / [@ripl/3d](../index.md) / Camera

# Class: Camera

Defined in: [3d/src/camera.ts:93](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L93)

An interactive camera controlling the 3D context's view and projection, with mouse/touch orbit, pan, and zoom.

## Extends

- [`Disposer`](../../core/classes/Disposer.md)

## Constructors

### Constructor

> **new Camera**(`scene`, `options?`): `Camera`

Defined in: [3d/src/camera.ts:171](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L171)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scene` | [`Scene`](../../core/classes/Scene.md)\<[`Context3D`](Context3D.md)\> |
| `options?` | [`CameraOptions`](../interfaces/CameraOptions.md) |

#### Returns

`Camera`

#### Overrides

[`Disposer`](../../core/classes/Disposer.md).[`constructor`](../../core/classes/Disposer.md#constructor)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaultkey"></a> `defaultKey` | `readonly` | *typeof* [`defaultKey`](Context3D.md#property-defaultkey) | [`Disposer`](../../core/classes/Disposer.md).[`defaultKey`](../../core/classes/Disposer.md#property-defaultkey) | [core/src/core/disposer.ts:10](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L10) |

## Accessors

### far

#### Get Signature

> **get** **far**(): `number`

Defined in: [3d/src/camera.ts:153](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L153)

##### Returns

`number`

#### Set Signature

> **set** **far**(`value`): `void`

Defined in: [3d/src/camera.ts:157](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L157)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### fov

#### Get Signature

> **get** **fov**(): `number`

Defined in: [3d/src/camera.ts:135](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L135)

##### Returns

`number`

#### Set Signature

> **set** **fov**(`value`): `void`

Defined in: [3d/src/camera.ts:139](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L139)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### near

#### Get Signature

> **get** **near**(): `number`

Defined in: [3d/src/camera.ts:144](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L144)

##### Returns

`number`

#### Set Signature

> **set** **near**(`value`): `void`

Defined in: [3d/src/camera.ts:148](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L148)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### position

#### Get Signature

> **get** **position**(): [`Vector3`](../type-aliases/Vector3.md)

Defined in: [3d/src/camera.ts:108](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L108)

##### Returns

[`Vector3`](../type-aliases/Vector3.md)

#### Set Signature

> **set** **position**(`value`): `void`

Defined in: [3d/src/camera.ts:112](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L112)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`Vector3`](../type-aliases/Vector3.md) |

##### Returns

`void`

***

### projection

#### Get Signature

> **get** **projection**(): `"perspective"` \| `"orthographic"`

Defined in: [3d/src/camera.ts:162](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L162)

##### Returns

`"perspective"` \| `"orthographic"`

#### Set Signature

> **set** **projection**(`value`): `void`

Defined in: [3d/src/camera.ts:166](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L166)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `"perspective"` \| `"orthographic"` |

##### Returns

`void`

***

### target

#### Get Signature

> **get** **target**(): [`Vector3`](../type-aliases/Vector3.md)

Defined in: [3d/src/camera.ts:117](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L117)

##### Returns

[`Vector3`](../type-aliases/Vector3.md)

#### Set Signature

> **set** **target**(`value`): `void`

Defined in: [3d/src/camera.ts:121](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L121)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`Vector3`](../type-aliases/Vector3.md) |

##### Returns

`void`

***

### up

#### Get Signature

> **get** **up**(): [`Vector3`](../type-aliases/Vector3.md)

Defined in: [3d/src/camera.ts:126](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L126)

##### Returns

[`Vector3`](../type-aliases/Vector3.md)

#### Set Signature

> **set** **up**(`value`): `void`

Defined in: [3d/src/camera.ts:130](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L130)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`Vector3`](../type-aliases/Vector3.md) |

##### Returns

`void`

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [3d/src/camera.ts:454](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L454)

Disposes all resources under the given key, or all resources if no key is provided.

#### Returns

`void`

#### Overrides

[`Disposer`](../../core/classes/Disposer.md).[`dispose`](../../core/classes/Disposer.md#dispose)

***

### flush()

> **flush**(): `void`

Defined in: [3d/src/camera.ts:202](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L202)

Flushes pending camera changes to the 3D context's view and projection matrices.

#### Returns

`void`

***

### lookAt()

> **lookAt**(`target`): `void`

Defined in: [3d/src/camera.ts:275](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L275)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`Vector3`](../type-aliases/Vector3.md) |

#### Returns

`void`

***

### orbit()

> **orbit**(`deltaTheta`, `deltaPhi`): `void`

Defined in: [3d/src/camera.ts:229](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L229)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deltaTheta` | `number` |
| `deltaPhi` | `number` |

#### Returns

`void`

***

### pan()

> **pan**(`dx`, `dy`): `void`

Defined in: [3d/src/camera.ts:249](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L249)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dx` | `number` |
| `dy` | `number` |

#### Returns

`void`

***

### retain()

> `protected` **retain**(`value`, `key?`): `void`

Defined in: [core/src/core/disposer.ts:13](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/disposer.ts#L13)

Registers a disposable resource under an optional key for later cleanup.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `value` | [`Disposable`](../../utilities/interfaces/Disposable.md) | `undefined` |
| `key` | `PropertyKey` | `Disposer.defaultKey` |

#### Returns

`void`

#### Inherited from

[`Disposer`](../../core/classes/Disposer.md).[`retain`](../../core/classes/Disposer.md#retain)

***

### zoom()

> **zoom**(`delta`): `void`

Defined in: [3d/src/camera.ts:265](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/3d/src/camera.ts#L265)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `delta` | `number` |

#### Returns

`void`
