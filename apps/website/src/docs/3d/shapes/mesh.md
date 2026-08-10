---
title: Mesh
description: Build 3D geometry from an explicit face list, for imported models, procedurally generated surfaces and hand-built assemblies no primitive covers.
---

# Mesh

The **Mesh** is built from an explicit list of faces. It is the escape hatch for geometry no primitive covers — imported models, procedurally generated surfaces, hand-built assemblies.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import {
    createMesh,
} from '@ripl/3d';

const pyramid = createMesh({
    faces: [
        {
            vertices: [[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]],
        },
        {
            vertices: [[-1, 0, 1], [1, 0, 1], [0, 1.6, 0]],
        },
    ],
    fill: '#cc8844',
});
```
:::

## Usage

```ts
import {
    createMesh,
} from '@ripl/3d';

const mesh = createMesh({
    faces: [
        {
            vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
            normals: [[0, 0, 1], [0, 0, 1], [0, 0, 1]],
            uvs: [[0, 0], [1, 0], [0, 1]],
            colors: ['#ff0000', '#00ff00', '#0000ff'],
        },
    ],
    material: {
        vertexColors: true,
    },
});
```

## Properties

- **`faces`**: the faces the mesh is built from, held by reference and never copied
- **`revision`**: a counter bumped whenever the face list is replaced

Each face carries:

- **`vertices`**: its vertices in local space, wound counter-clockwise when viewed from the front
- **`normal`**: an optional precomputed face normal; derived from the first three vertices when omitted
- **`normals`**: optional per-vertex normals, enabling smooth shading
- **`uvs`**: optional per-vertex texture coordinates
- **`colors`**: optional per-vertex colours, used when the material sets `vertexColors`

## Replacing the geometry

The faces live outside element state and are only read, because `computeFaces` fires on every cache invalidation. Call `setFaces` to replace them.

```ts
mesh.setFaces(nextFaces);
```

## Type Guard

```ts
import {
    elementIsMesh,
} from '@ripl/3d';

if (elementIsMesh(element)) {
    console.log(element.faces.length);
}
```

<script lang="ts" setup>
import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createMesh,
} from '@ripl/3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createMesh({
        faces: [
            { vertices: [[-1, 0, 1], [1, 0, 1], [0, 1.6, 0]] },
            { vertices: [[1, 0, 1], [1, 0, -1], [0, 1.6, 0]] },
            { vertices: [[1, 0, -1], [-1, 0, -1], [0, 1.6, 0]] },
            { vertices: [[-1, 0, -1], [-1, 0, 1], [0, 1.6, 0]] },
            { vertices: [[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]] },
        ],
        y: -0.6,
        fill: '#cc8844',
    }));

    startRotation(camera);
});
</script>
