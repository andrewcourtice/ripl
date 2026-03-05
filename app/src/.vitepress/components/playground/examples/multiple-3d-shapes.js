import {
    createCube,
    createSphere,
} from '@ripl/3d';

scene.add([
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
]);

renderer.start();
