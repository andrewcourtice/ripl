export const DEFAULT_2D_CODE = `import {
    createCircle
} from '@ripl/core';

const circle = createCircle({
    cx: scene.context.width / 2,
    cy: scene.context.height / 2,
    radius: 80,
    fillStyle: '#6366f1',
});

scene.add(circle);
renderer.start();
`;

export const DEFAULT_3D_CODE = `import {
    createCube
} from '@ripl/3d';

const cube = createCube({
    size: 1,
    fillStyle: '#6366f1',
});

scene.add(cube);
renderer.start();
`;
