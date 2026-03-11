[Documentation](../../../packages.md) / [@ripl/charts](../index.md) / RibbonState

# Interface: RibbonState

Defined in: [charts/src/elements/ribbon.ts:16](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/elements/ribbon.ts#L16)

State interface for a ribbon shape connecting two arc segments via quadratic curves.

## Extends

- [`BaseElementState`](../../core/type-aliases/BaseElementState.md)

## Properties

| Property | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cx"></a> `cx` | `number` | - | [charts/src/elements/ribbon.ts:17](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/elements/ribbon.ts#L17) |
| <a id="property-cy"></a> `cy` | `number` | - | [charts/src/elements/ribbon.ts:18](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/elements/ribbon.ts#L18) |
| <a id="property-direction"></a> `direction?` | [`Direction`](../../core/type-aliases/Direction.md) | `BaseElementState.direction` | [core/src/context/\_base/index.ts:149](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L149) |
| <a id="property-fill"></a> `fill?` | `string` | `BaseElementState.fill` | [core/src/context/\_base/index.ts:147](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L147) |
| <a id="property-filter"></a> `filter?` | `string` | `BaseElementState.filter` | [core/src/context/\_base/index.ts:148](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L148) |
| <a id="property-font"></a> `font?` | `string` | `BaseElementState.font` | [core/src/context/\_base/index.ts:150](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L150) |
| <a id="property-fontkerning"></a> `fontKerning?` | [`FontKerning`](../../core/type-aliases/FontKerning.md) | `BaseElementState.fontKerning` | [core/src/context/\_base/index.ts:151](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L151) |
| <a id="property-globalcompositeoperation"></a> `globalCompositeOperation?` | `unknown` | `BaseElementState.globalCompositeOperation` | [core/src/context/\_base/index.ts:153](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L153) |
| <a id="property-linecap"></a> `lineCap?` | [`LineCap`](../../core/type-aliases/LineCap.md) | `BaseElementState.lineCap` | [core/src/context/\_base/index.ts:154](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L154) |
| <a id="property-linedash"></a> `lineDash?` | `number`[] | `BaseElementState.lineDash` | [core/src/context/\_base/index.ts:155](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L155) |
| <a id="property-linedashoffset"></a> `lineDashOffset?` | `number` | `BaseElementState.lineDashOffset` | [core/src/context/\_base/index.ts:156](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L156) |
| <a id="property-linejoin"></a> `lineJoin?` | [`LineJoin`](../../core/type-aliases/LineJoin.md) | `BaseElementState.lineJoin` | [core/src/context/\_base/index.ts:157](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L157) |
| <a id="property-linewidth"></a> `lineWidth?` | `number` | `BaseElementState.lineWidth` | [core/src/context/\_base/index.ts:158](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L158) |
| <a id="property-miterlimit"></a> `miterLimit?` | `number` | `BaseElementState.miterLimit` | [core/src/context/\_base/index.ts:159](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L159) |
| <a id="property-opacity"></a> `opacity?` | `number` | `BaseElementState.opacity` | [core/src/context/\_base/index.ts:152](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L152) |
| <a id="property-radius"></a> `radius` | `number` | - | [charts/src/elements/ribbon.ts:19](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/elements/ribbon.ts#L19) |
| <a id="property-rotation"></a> `rotation?` | [`Rotation`](../../core/type-aliases/Rotation.md) | `BaseElementState.rotation` | [core/src/context/\_base/index.ts:172](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L172) |
| <a id="property-shadowblur"></a> `shadowBlur?` | `number` | `BaseElementState.shadowBlur` | [core/src/context/\_base/index.ts:160](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L160) |
| <a id="property-shadowcolor"></a> `shadowColor?` | `string` | `BaseElementState.shadowColor` | [core/src/context/\_base/index.ts:161](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L161) |
| <a id="property-shadowoffsetx"></a> `shadowOffsetX?` | `number` | `BaseElementState.shadowOffsetX` | [core/src/context/\_base/index.ts:162](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L162) |
| <a id="property-shadowoffsety"></a> `shadowOffsetY?` | `number` | `BaseElementState.shadowOffsetY` | [core/src/context/\_base/index.ts:163](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L163) |
| <a id="property-sourceend"></a> `sourceEnd` | `number` | - | [charts/src/elements/ribbon.ts:21](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/elements/ribbon.ts#L21) |
| <a id="property-sourcestart"></a> `sourceStart` | `number` | - | [charts/src/elements/ribbon.ts:20](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/elements/ribbon.ts#L20) |
| <a id="property-stroke"></a> `stroke?` | `string` | `BaseElementState.stroke` | [core/src/context/\_base/index.ts:164](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L164) |
| <a id="property-targetend"></a> `targetEnd` | `number` | - | [charts/src/elements/ribbon.ts:23](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/elements/ribbon.ts#L23) |
| <a id="property-targetstart"></a> `targetStart` | `number` | - | [charts/src/elements/ribbon.ts:22](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/charts/src/elements/ribbon.ts#L22) |
| <a id="property-textalign"></a> `textAlign?` | [`TextAlignment`](../../core/type-aliases/TextAlignment.md) | `BaseElementState.textAlign` | [core/src/context/\_base/index.ts:165](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L165) |
| <a id="property-textbaseline"></a> `textBaseline?` | [`TextBaseline`](../../core/type-aliases/TextBaseline.md) | `BaseElementState.textBaseline` | [core/src/context/\_base/index.ts:166](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L166) |
| <a id="property-transformoriginx"></a> `transformOriginX?` | [`TransformOrigin`](../../core/type-aliases/TransformOrigin.md) | `BaseElementState.transformOriginX` | [core/src/context/\_base/index.ts:173](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L173) |
| <a id="property-transformoriginy"></a> `transformOriginY?` | [`TransformOrigin`](../../core/type-aliases/TransformOrigin.md) | `BaseElementState.transformOriginY` | [core/src/context/\_base/index.ts:174](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L174) |
| <a id="property-transformscalex"></a> `transformScaleX?` | `number` | `BaseElementState.transformScaleX` | [core/src/context/\_base/index.ts:170](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L170) |
| <a id="property-transformscaley"></a> `transformScaleY?` | `number` | `BaseElementState.transformScaleY` | [core/src/context/\_base/index.ts:171](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L171) |
| <a id="property-translatex"></a> `translateX?` | `number` | `BaseElementState.translateX` | [core/src/context/\_base/index.ts:168](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L168) |
| <a id="property-translatey"></a> `translateY?` | `number` | `BaseElementState.translateY` | [core/src/context/\_base/index.ts:169](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L169) |
| <a id="property-zindex"></a> `zIndex?` | `number` | `BaseElementState.zIndex` | [core/src/context/\_base/index.ts:167](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/context/_base/index.ts#L167) |
