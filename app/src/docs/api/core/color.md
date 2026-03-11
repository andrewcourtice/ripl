---
outline: "deep"
---

# Color

<p class="api-package-badge"><code>@ripl/core</code></p>

Color parsing, serialization, and utility functions.

## Overview

**Classes:** [`ColorParseError`](#colorparseerror)

**Interfaces:** [`ColorParser`](#colorparser)

**Type Aliases:** [`ColorRGBA`](#colorrgba) · [`ColorHSL`](#colorhsl) · [`ColorHSLA`](#colorhsla) · [`ColorHSV`](#colorhsv) · [`ColorHSVA`](#colorhsva) · [`ColorSpace`](#colorspace)

**Functions:** [`getColorParser`](#getcolorparser) · [`parseColor`](#parsecolor) · [`parseHEX`](#parsehex) · [`parseRGB`](#parsergb) · [`parseRGBA`](#parsergba) · [`parseHSL`](#parsehsl) · [`parseHSLA`](#parsehsla) · [`parseHSV`](#parsehsv) · [`parseHSVA`](#parsehsva) · [`rgbChannelToHEX`](#rgbchanneltohex) · [`serialiseHEX`](#serialisehex) · [`serialiseRGB`](#serialisergb) · [`serialiseRGBA`](#serialisergba) · [`serialiseHSL`](#serialisehsl) · [`serialiseHSLA`](#serialisehsla) · [`serialiseHSV`](#serialisehsv) · [`serialiseHSVA`](#serialisehsva) · [`setColorAlpha`](#setcoloralpha) · [`rgbaToHSL`](#rgbatohsl) · [`hslToRGBA`](#hsltorgba) · [`rgbaToHSV`](#rgbatohsv) · [`hsvToRGBA`](#hsvtorgba)

### ColorParseError `class`

Error thrown when a color string cannot be parsed in the expected format.

```ts
class ColorParseError extends Error
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |
| `type` | `ColorSpace` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` |  |
| `message` | `string` |  |
| `stack` | `string \| undefined` |  |
| `cause` | `unknown` |  |
---

### ColorParser `interface`

A color parser that can test, parse, and serialise a specific color format.

```ts
interface ColorParser {
    pattern: RegExp;
    parse(value: string): ColorRGBA;
    serialise(...args: ColorRGBA): string;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `pattern` | `RegExp` |  |
| `parse` | `(value: string) =&gt; ColorRGBA` |  |
| `serialise` | `(red: number, green: number, blue: number, alpha: number) =&gt; string` |  |
---

### ColorRGBA `type`

An RGBA color represented as a four-element tuple of channel values.

```ts
type ColorRGBA = [red: number, green: number, blue: number, alpha: number];
```

---

### ColorHSL `type`

An HSL color represented as a three-element tuple.

```ts
type ColorHSL = [hue: number, saturation: number, lightness: number];
```

---

### ColorHSLA `type`

An HSLA color represented as a four-element tuple.

```ts
type ColorHSLA = [hue: number, saturation: number, lightness: number, alpha: number];
```

---

### ColorHSV `type`

An HSV color represented as a three-element tuple.

```ts
type ColorHSV = [hue: number, saturation: number, value: number];
```

---

### ColorHSVA `type`

An HSVA color represented as a four-element tuple.

```ts
type ColorHSVA = [hue: number, saturation: number, value: number, alpha: number];
```

---

### ColorSpace `type`

Supported color space identifiers.

```ts
type ColorSpace = 'hex'
| 'rgb'
| 'rgba'
| 'hsl'
| 'hsla'
| 'hsv'
| 'hsva';
```

---

### getColorParser `function`

Finds the first color parser whose pattern matches the given color string.

```ts
function getColorParser(value: string): ColorParser | undefined
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `ColorParser \| undefined`

---

### parseColor `function`

Parses any supported color string into an RGBA tuple, or returns `undefined` if no parser matches.

```ts
function parseColor(value: string): ColorRGBA | undefined
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `ColorRGBA \| undefined`

---

### parseHEX `function`

Parses a hexadecimal color string (e.g. `#ff0000` or `#ff000080`) into an RGBA tuple.

```ts
function parseHEX(value: string): ColorRGBA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `ColorRGBA`

---

### parseRGB `function`

Parses an `rgb()` color string into an RGBA tuple with alpha set to 1.

```ts
function parseRGB(value: string): ColorRGBA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `ColorRGBA`

---

### parseRGBA `function`

Parses an `rgba()` color string into an RGBA tuple.

```ts
function parseRGBA(value: string): ColorRGBA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `ColorRGBA`

---

### parseHSL `function`

Parses an `hsl()` color string into an RGBA tuple.

```ts
function parseHSL(value: string): ColorRGBA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `ColorRGBA`

---

### parseHSLA `function`

Parses an `hsla()` color string into an RGBA tuple.

```ts
function parseHSLA(value: string): ColorRGBA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `ColorRGBA`

---

### parseHSV `function`

Parses an `hsv()` color string into an RGBA tuple.

```ts
function parseHSV(value: string): ColorRGBA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `ColorRGBA`

---

### parseHSVA `function`

Parses an `hsva()` color string into an RGBA tuple.

```ts
function parseHSVA(value: string): ColorRGBA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `ColorRGBA`

---

### rgbChannelToHEX `function`

Converts a single RGB channel value (0–255) to a two-character hexadecimal string.

```ts
function rgbChannelToHEX(channel: number): string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `channel` | `number` |  |

**Returns:** `string`

---

### serialiseHEX `function`

Serialises RGBA channel values into a hexadecimal color string (e.g. `#ff0000`).

```ts
function serialiseHEX(...args: ColorRGBA): string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `args` | `ColorRGBA` |  |

**Returns:** `string`

---

### serialiseRGB `function`

Serialises RGBA channel values into an `rgb()` color string.

```ts
function serialiseRGB(...args: ColorRGBA): string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `args` | `ColorRGBA` |  |

**Returns:** `string`

---

### serialiseRGBA `function`

Serialises RGBA channel values into an `rgba()` color string.

```ts
function serialiseRGBA(...args: ColorRGBA): string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `args` | `ColorRGBA` |  |

**Returns:** `string`

---

### serialiseHSL `function`

Serialises RGBA channel values into an `hsl()` color string.

```ts
function serialiseHSL(...args: ColorRGBA): string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `args` | `ColorRGBA` |  |

**Returns:** `string`

---

### serialiseHSLA `function`

Serialises RGBA channel values into an `hsla()` color string.

```ts
function serialiseHSLA(...args: ColorRGBA): string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `args` | `ColorRGBA` |  |

**Returns:** `string`

---

### serialiseHSV `function`

Serialises RGBA channel values into an `hsv()` color string.

```ts
function serialiseHSV(...args: ColorRGBA): string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `args` | `ColorRGBA` |  |

**Returns:** `string`

---

### serialiseHSVA `function`

Serialises RGBA channel values into an `hsva()` color string.

```ts
function serialiseHSVA(...args: ColorRGBA): string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `args` | `ColorRGBA` |  |

**Returns:** `string`

---

### setColorAlpha `function`

Returns a new color string with the alpha channel replaced by the given value.

```ts
function setColorAlpha(color: string, alpha: number)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` |  |
| `alpha` | `number` |  |

**Returns:** `string`

---

### rgbaToHSL `function`

Converts RGBA channel values to an HSLA tuple.

```ts
function rgbaToHSL(red: number, green: number, blue: number, alpha: number = 1): ColorHSLA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `red` | `number` |  |
| `green` | `number` |  |
| `blue` | `number` |  |
| `alpha` | `number` |  |

**Returns:** `ColorHSLA`

---

### hslToRGBA `function`

Converts HSLA values to an RGBA tuple.

```ts
function hslToRGBA(hue: number, saturation: number, lightness: number, alpha: number = 1): ColorRGBA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `hue` | `number` |  |
| `saturation` | `number` |  |
| `lightness` | `number` |  |
| `alpha` | `number` |  |

**Returns:** `ColorRGBA`

---

### rgbaToHSV `function`

Converts RGBA channel values to an HSVA tuple.

```ts
function rgbaToHSV(red: number, green: number, blue: number, alpha: number = 1): ColorHSVA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `red` | `number` |  |
| `green` | `number` |  |
| `blue` | `number` |  |
| `alpha` | `number` |  |

**Returns:** `ColorHSVA`

---

### hsvToRGBA `function`

Converts HSVA values to an RGBA tuple.

```ts
function hsvToRGBA(hue: number, saturation: number, value: number, alpha: number = 1): ColorRGBA
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `hue` | `number` |  |
| `saturation` | `number` |  |
| `value` | `number` |  |
| `alpha` | `number` |  |

**Returns:** `ColorRGBA`

---

