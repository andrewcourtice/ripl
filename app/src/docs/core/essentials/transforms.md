---
outline: "deep"
---

# Transforms

Ripl supports element-level transformations — translate, scale, and rotate — that apply to any element or group. Transforms are set as properties on the element and are automatically applied to the rendering context before the element draws.

## Transform Properties

Every element exposes these transform properties:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `translateX` | `number` | `0` | Horizontal translation in pixels |
| `translateY` | `number` | `0` | Vertical translation in pixels |
| `transformScaleX` | `number` | `1` | Horizontal scale factor |
| `transformScaleY` | `number` | `1` | Vertical scale factor |
| `rotation` | `number \| string` | `0` | Rotation angle (see below) |
| `transformOriginX` | `number \| string` | `0` | Horizontal origin for rotation/scale |
| `transformOriginY` | `number \| string` | `0` | Vertical origin for rotation/scale |

## Rotation

Rotation can be specified as a number (radians) or a string with a unit suffix:

```ts
// Radians (number)
rect.rotation = Math.PI / 4;

// Degrees (string)
rect.rotation = '45deg';

// Radians (string)
rect.rotation = '0.785rad';
```

When no unit suffix is provided on a string value, it is treated as radians.

## Transform Origin

Transform origin defines the pivot point for rotation and scale. It can be a number (pixels) or a percentage string relative to the element's bounding box:

```ts
// Pixel values
rect.transformOriginX = 50;
rect.transformOriginY = 50;

// Percentage of element dimensions
rect.transformOriginX = '50%';
rect.transformOriginY = '50%';
```

When set to `'50%'`, the element rotates and scales around its center. The percentage is resolved relative to the element's `width` and `height` properties.

## Application Order

Transforms are applied to the rendering context in the following order:

1. **Translate** to the origin point (`transformOriginX`, `transformOriginY`)
2. **Translate** by `translateX`, `translateY`
3. **Rotate** by `rotation`
4. **Scale** by `transformScaleX`, `transformScaleY`
5. **Translate** back from the origin point

This order ensures that rotation and scaling happen around the specified origin.

## Group Inheritance

When transforms are applied to a group, all children inherit the transformation. The context is saved before the group renders and restored afterward, so transforms compose naturally:

```ts
import { createGroup, createRect, createCircle } from '@ripl/core';

const group = createGroup({
    children: [
        createRect({ x: 0, y: 0, width: 80, height: 80, fillStyle: '#3a86ff' }),
        createCircle({ cx: 120, cy: 40, radius: 30, fillStyle: '#ff006e' }),
    ],
});

// Both children will be translated and rotated together
group.translateX = 100;
group.translateY = 50;
group.rotation = '15deg';
```

## Animating Transforms

All transform properties are fully animatable using `renderer.transition()`. String values (degrees, percentages) are interpolated smoothly:

```ts
// Animate rotation from 0 to 360 degrees
await renderer.transition(rect, {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        rotation: '360deg',
    },
});

// Animate translation
await renderer.transition(rect, {
    duration: 800,
    state: {
        translateX: 200,
        translateY: 100,
    },
});

// Animate scale
await renderer.transition(rect, {
    duration: 600,
    state: {
        transformScaleX: 2,
        transformScaleY: 2,
    },
});
```

## SVG Support

Transforms work identically for both Canvas and SVG contexts. In the SVG context, transforms are serialised as SVG `transform` attribute values (e.g., `translate(10,20) rotate(45) scale(2,2)`), and the transform state is saved and restored alongside the context state stack.

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="runTranslate">Translate</button>
            <button class="ripl-button" @click="runRotate">Rotate</button>
            <button class="ripl-button" @click="runScale">Scale</button>
            <button class="ripl-button" @click="runCombined">Combined</button>
            <button class="ripl-button" @click="reset">Reset</button>
        </div>
    </template>
</ripl-example>
== Code
```ts
import {
    createScene,
    createRenderer,
    createRect,
    easeOutCubic,
    easeInOutQuad,
} from '@ripl/core';

const rect = createRect({
    x: 160, y: 100,
    width: 80, height: 80,
    fillStyle: '#3a86ff',
    transformOriginX: '50%',
    transformOriginY: '50%',
});

const scene = createScene('.container', { children: [rect] });
const renderer = createRenderer(scene);

// Translate
await renderer.transition(rect, {
    duration: 800, ease: easeOutCubic,
    state: { translateX: 100 },
});

// Rotate
await renderer.transition(rect, {
    duration: 1000, ease: easeInOutQuad,
    state: { rotation: '360deg' },
});

// Scale
await renderer.transition(rect, {
    duration: 600, ease: easeOutCubic,
    state: { transformScaleX: 1.5, transformScaleY: 1.5 },
});

// Combined
await renderer.transition(rect, {
    duration: 1200, ease: easeInOutQuad,
    state: {
        translateX: 80,
        rotation: '180deg',
        transformScaleX: 1.4,
        transformScaleY: 1.4,
    },
});
```
:::

<script lang="ts" setup>
import {
    createRect, createScene, createRenderer,
    Scene, Renderer, Rect,
    easeOutCubic, easeInOutQuad,
} from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

let dScene: Scene;
let dRenderer: Renderer;
let dRect: Rect;

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    dRect = createRect({
        x: w / 2 - 40,
        y: h / 2 - 40,
        width: 80,
        height: 80,
        fillStyle: '#3a86ff',
        transformOriginX: '50%',
        transformOriginY: '50%',
    });

    dScene = createScene(context, { children: [dRect] });
    dRenderer = createRenderer(dScene);
    dScene.render();
});

async function runTranslate() {
    if (!dRenderer || !dRect) return;

    await dRenderer.transition(dRect, {
        duration: 800, ease: easeOutCubic,
        state: { translateX: 80 },
    });
    await dRenderer.transition(dRect, {
        duration: 800, ease: easeInOutQuad,
        state: { translateX: -80 },
    });
    await dRenderer.transition(dRect, {
        duration: 600, ease: easeOutCubic,
        state: { translateX: 0 },
    });
}

async function runRotate() {
    if (!dRenderer || !dRect) return;

    await dRenderer.transition(dRect, {
        duration: 1200, ease: easeInOutQuad,
        state: { rotation: '360deg' },
    });
    dRect.rotation = 0;
    dScene.render();
}

async function runScale() {
    if (!dRenderer || !dRect) return;

    await dRenderer.transition(dRect, {
        duration: 500, ease: easeOutCubic,
        state: { transformScaleX: 1.8, transformScaleY: 1.8 },
    });
    await dRenderer.transition(dRect, {
        duration: 500, ease: easeInOutQuad,
        state: { transformScaleX: 1, transformScaleY: 1 },
    });
}

async function runCombined() {
    if (!dRenderer || !dRect) return;

    await dRenderer.transition(dRect, {
        duration: 1200, ease: easeInOutQuad,
        state: {
            translateX: 60,
            rotation: '180deg',
            transformScaleX: 1.4,
            transformScaleY: 1.4,
        },
    });
    await dRenderer.transition(dRect, {
        duration: 1200, ease: easeInOutQuad,
        state: {
            translateX: 0,
            rotation: '360deg',
            transformScaleX: 1,
            transformScaleY: 1,
        },
    });
    dRect.rotation = 0;
    dScene.render();
}

async function reset() {
    if (!dRenderer || !dRect) return;

    await dRenderer.transition(dRect, {
        duration: 400, ease: easeOutCubic,
        state: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            transformScaleX: 1,
            transformScaleY: 1,
        },
    });
}
</script>
