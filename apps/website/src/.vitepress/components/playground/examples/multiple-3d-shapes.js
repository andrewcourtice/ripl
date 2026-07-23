import {
    createCube,
    createSphere,
} from '@ripl/3d';

scene.add([
    createCube({
        x: -1.5,
        size: 0.8,
        fill: '#6366f1',
    }),
    createSphere({
        radius: 0.5,
        segments: 24,
        fill: '#f59e0b',
    }),
    createCube({
        x: 1.5,
        size: 0.8,
        fill: '#10b981',
    }),
]);