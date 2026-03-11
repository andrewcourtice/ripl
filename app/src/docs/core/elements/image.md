---
outline: "deep"
---

# Image

An **Image** renders a `CanvasImageSource` (such as an `HTMLImageElement`, `HTMLCanvasElement`, or `ImageBitmap`) to any context. The standout feature is crossfade interpolation — when you transition between two image sources using `interpolateImage`, Ripl composites both images onto an offscreen canvas and smoothly blends between them. This makes image carousels, thumbnail previews, and data-driven image swaps trivially easy to animate.

## Example

Click **Next Image** to crossfade between images using `interpolateImage`.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="nextImage">Next Image</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createImage,
    createRenderer,
    createScene,
    easeInOutQuad,
    interpolateImage,
} from '@ripl/core';

const scene = createScene('.container', {
    children: [
        createImage({
            image: img,
            x: 50,
            y: 50,
            width: 300,
            height: 200,
        }),
    ],
});

const renderer = createRenderer(scene);
const imageEl = scene.query('image');

await renderer.transition(imageEl, {
    duration: 800,
    ease: easeInOutQuad,
    state: {
        image: interpolateImage(currentImg, nextImg),
    },
});
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createImage as createImageElement,
    createRenderer,
    createScene,
    easeInOutQuad,
    ImageElement,
    interpolateImage,
    Renderer,
    Scene,
} from '@ripl/core';

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

const IMAGES = [
    'https://picsum.photos/seed/ripl-a/400/300',
    'https://picsum.photos/seed/ripl-b/400/300',
    'https://picsum.photos/seed/ripl-c/400/300',
    'https://picsum.photos/seed/ripl-d/400/300',
];

let dScene: Scene;
let dRenderer: Renderer;
let dImageEl: ImageElement;
let dImages: HTMLImageElement[] = [];
let currentIndex = 0;

const {
    contextChanged
} = useRiplExample(context => {
    const init = async () => {
        dImages = await Promise.all(IMAGES.map(loadImage));

        const cw = context.width;
        const ch = context.height;
        const imgWidth = cw * 0.7;
        const imgHeight = imgWidth * 0.75;

        dImageEl = createImageElement({
            image: dImages[0],
            x: cw / 2 - imgWidth / 2,
            y: ch / 2 - imgHeight / 2,
            width: imgWidth,
            height: imgHeight,
        });

        currentIndex = 0;
        dScene = createScene(context, { children: [dImageEl] });
        dRenderer = createRenderer(dScene);
        dScene.render();
    };

    init();
});

async function nextImage() {
    if (!dRenderer || !dImageEl || !dImages.length) return;

    currentIndex = (currentIndex + 1) % dImages.length;

    const prevImage = dImageEl.image;

    await dRenderer.transition(dImageEl, {
        duration: 800,
        ease: easeInOutQuad,
        state: { image: interpolateImage(prevImage, dImages[currentIndex]) },
    });
}
</script>

## Usage

```ts
import {
    createImage,
} from '@ripl/core';

const img = new Image();
img.src = '/photo.jpg';

img.onload = () => {
    const image = createImage({
        image: img,
        x: 50,
        y: 50,
        width: 200,
        height: 150,
    });
};
```

## Properties

The image element is defined by `image` (a `CanvasImageSource`), `x`, `y`, and optional `width`/`height` (defaults to the source's intrinsic dimensions).

> [!NOTE]
> For the full property list, see the [Image API Reference](/docs/api/core/elements).

## Interpolation

The `interpolateImage` factory produces a crossfade between two image sources. It composites both images onto an offscreen canvas, blending from one to the other over the transition.

```ts
import {
    interpolateImage,
} from '@ripl/core';

// Pass the interpolator directly as the state value
renderer.transition(imageElement, {
    duration: 800,
    state: { image: interpolateImage(currentImage, nextImage) },
});
```
