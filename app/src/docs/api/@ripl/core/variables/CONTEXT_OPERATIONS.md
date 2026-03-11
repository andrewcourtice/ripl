[Documentation](../../../packages.md) / [@ripl/core](../index.md) / CONTEXT\_OPERATIONS

# Variable: CONTEXT\_OPERATIONS

> `const` **CONTEXT\_OPERATIONS**: `object`

Defined in: [packages/core/src/core/constants.ts:30](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/core/constants.ts#L30)

Maps element state properties to their corresponding context setter functions.

## Type Declaration

### direction()

> **direction**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `NonNullable`\<[`Direction`](../type-aliases/Direction.md) \| `undefined`\> |

#### Returns

`void`

### fill()

> **fill**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `string` |

#### Returns

`void`

### filter()

> **filter**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `string` |

#### Returns

`void`

### font()

> **font**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `string` |

#### Returns

`void`

### fontKerning()

> **fontKerning**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `NonNullable`\<[`FontKerning`](../type-aliases/FontKerning.md) \| `undefined`\> |

#### Returns

`void`

### globalCompositeOperation()

> **globalCompositeOperation**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | \{ \} |

#### Returns

`void`

### lineCap()

> **lineCap**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `NonNullable`\<[`LineCap`](../type-aliases/LineCap.md) \| `undefined`\> |

#### Returns

`void`

### lineDash()

> **lineDash**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number`[] |

#### Returns

`void`

### lineDashOffset()

> **lineDashOffset**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### lineJoin()

> **lineJoin**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `NonNullable`\<[`LineJoin`](../type-aliases/LineJoin.md) \| `undefined`\> |

#### Returns

`void`

### lineWidth()

> **lineWidth**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### miterLimit()

> **miterLimit**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### opacity()

> **opacity**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### rotation()

> **rotation**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `NonNullable`\<[`Rotation`](../type-aliases/Rotation.md) \| `undefined`\> |

#### Returns

`void`

### shadowBlur()

> **shadowBlur**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### shadowColor()

> **shadowColor**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `string` |

#### Returns

`void`

### shadowOffsetX()

> **shadowOffsetX**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### shadowOffsetY()

> **shadowOffsetY**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### stroke()

> **stroke**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `string` |

#### Returns

`void`

### textAlign()

> **textAlign**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `NonNullable`\<[`TextAlignment`](../type-aliases/TextAlignment.md) \| `undefined`\> |

#### Returns

`void`

### textBaseline()

> **textBaseline**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `NonNullable`\<[`TextBaseline`](../type-aliases/TextBaseline.md) \| `undefined`\> |

#### Returns

`void`

### transformOriginX()

> **transformOriginX**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `NonNullable`\<[`TransformOrigin`](../type-aliases/TransformOrigin.md) \| `undefined`\> |

#### Returns

`void`

### transformOriginY()

> **transformOriginY**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `NonNullable`\<[`TransformOrigin`](../type-aliases/TransformOrigin.md) \| `undefined`\> |

#### Returns

`void`

### transformScaleX()

> **transformScaleX**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### transformScaleY()

> **transformScaleY**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### translateX()

> **translateX**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### translateY()

> **translateY**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`

### zIndex()

> **zIndex**: (`context`, `value`) => `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](../classes/Context.md) |
| `value` | `number` |

#### Returns

`void`
