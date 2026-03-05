export interface PlaygroundExample {
    label: string;
    mode: '2d' | '3d';
    code: string;
}

export const EXAMPLES: PlaygroundExample[] = [
    {
        label: 'Circle',
        mode: '2d',
        code: `import {
    createCircle
} from '@ripl/core';

const circle = createCircle({
    cx: scene.context.width / 2,
    cy: scene.context.height / 2,
    radius: 80,
    fillStyle: '#6366f1',
});

scene.add(circle);
`,
    },
    {
        label: 'Rectangle',
        mode: '2d',
        code: `import {
    createRect
} from '@ripl/core';

const rect = createRect({
    x: scene.context.width / 2 - 60,
    y: scene.context.height / 2 - 40,
    width: 120,
    height: 80,
    fillStyle: '#6366f1',
    cornerRadius: 8,
});

scene.add(rect);
`,
    },
    {
        label: 'Multiple Shapes',
        mode: '2d',
        code: `import {
    createCircle,
    createRect,
    createGroup
} from '@ripl/core';

const cx = scene.context.width / 2;
const cy = scene.context.height / 2;

const group = createGroup({
    children: [
        createRect({
            x: cx - 100,
            y: cy - 40,
            width: 80,
            height: 80,
            fillStyle: '#6366f1',
            cornerRadius: 8,
        }),
        createCircle({
            cx: cx,
            cy: cy,
            radius: 40,
            fillStyle: '#f59e0b',
        }),
        createRect({
            x: cx + 20,
            y: cy - 40,
            width: 80,
            height: 80,
            fillStyle: '#10b981',
            cornerRadius: 8,
        }),
    ],
});

scene.add(group);
`,
    },
    {
        label: 'Animation',
        mode: '2d',
        code: `import {
    createCircle
} from '@ripl/core';

const cx = scene.context.width / 2;
const cy = scene.context.height / 2;

const circle = createCircle({
    cx,
    cy,
    radius: 20,
    fillStyle: '#6366f1',
});

scene.add(circle);

circle.set({
    radius: 80,
}, {
    duration: 1200,
    easing: 'easeInOutCubic',
});

renderer.start();
`,
    },
    {
        label: 'Text',
        mode: '2d',
        code: `import {
    createText
} from '@ripl/core';

const text = createText({
    x: scene.context.width / 2,
    y: scene.context.height / 2,
    body: 'Hello Ripl!',
    fontSize: 48,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold',
    fillStyle: '#6366f1',
    textAlign: 'center',
    textBaseline: 'middle',
});

scene.add(text);
renderer.start();
`,
    },
    {
        label: 'Cube',
        mode: '3d',
        code: `import {
    createCube
} from '@ripl/3d';

const cube = createCube({
    size: 1,
    fillStyle: '#6366f1',
});

scene.add(cube);
renderer.start();
`,
    },
    {
        label: 'Sphere',
        mode: '3d',
        code: `import {
    createSphere
} from '@ripl/3d';

const sphere = createSphere({
    radius: 0.8,
    segments: 32,
    fillStyle: '#6366f1',
});

scene.add(sphere);
renderer.start();
`,
    },
    {
        label: 'Multiple 3D Shapes',
        mode: '3d',
        code: `import {
    createCube,
    createSphere,
    createGroup
} from '@ripl/3d';

import {
    createGroup as createCoreGroup
} from '@ripl/core';

const group = createCoreGroup({
    children: [
        createCube({
            x: -1.5,
            size: 0.8,
            fillStyle: '#6366f1',
        }),
        createSphere({
            radius: 0.5,
            segments: 24,
            fillStyle: '#f59e0b',
        }),
        createCube({
            x: 1.5,
            size: 0.8,
            fillStyle: '#10b981',
        }),
    ],
});

scene.add(group);
renderer.start();
`,
    },
];
