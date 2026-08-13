import {
    createCube,
    createSphere,
} from '@ripl/3d';

scene.add([
    createCube({
        x: -1.35,
        size: 0.9,
        fill: '#6366f1',
    }),
    createSphere({
        radius: 0.5,
        segments: 24,
        fill: '#f59e0b',
    }),
    createCube({
        x: 1.35,
        size: 0.9,
        fill: '#10b981',
    }),
]);