import animationCode from './animation.js?raw';

import bezierEditorCode from './bezier-editor.js?raw';

import boidsCode from './boids.js?raw';

import circleCode from './circle.js?raw';

import cubeCode from './cube.js?raw';

import lineChartCode from './line-chart.js?raw';

import multiple3dShapesCode from './multiple-3d-shapes.js?raw';

import multipleShapesCode from './multiple-shapes.js?raw';

import particleFountainCode from './particle-fountain.js?raw';

import pongCode from './pong.js?raw';

import rectangleCode from './rectangle.js?raw';

import sphereCode from './sphere.js?raw';

import textCode from './text.js?raw';

import solarSystemCode from './solar-system.js?raw';

import waveGridCode from './wave-grid.js?raw';

export interface PlaygroundExample {
    label: string;
    mode: '2d' | '3d';
    code: string;
}

export const EXAMPLES: PlaygroundExample[] = [
    {
        label: 'Circle',
        mode: '2d',
        code: circleCode,
    },
    {
        label: 'Rectangle',
        mode: '2d',
        code: rectangleCode,
    },
    {
        label: 'Multiple Shapes',
        mode: '2d',
        code: multipleShapesCode,
    },
    {
        label: 'Animation',
        mode: '2d',
        code: animationCode,
    },
    {
        label: 'Line Chart',
        mode: '2d',
        code: lineChartCode,
    },
    {
        label: 'Text',
        mode: '2d',
        code: textCode,
    },
    {
        label: 'Solar System',
        mode: '2d',
        code: solarSystemCode,
    },
    {
        label: 'Bezier Editor',
        mode: '2d',
        code: bezierEditorCode,
    },
    {
        label: 'Particle Fountain',
        mode: '2d',
        code: particleFountainCode,
    },
    {
        label: 'Boids Flocking',
        mode: '2d',
        code: boidsCode,
    },
    {
        label: 'Pong',
        mode: '2d',
        code: pongCode,
    },
    {
        label: 'Cube',
        mode: '3d',
        code: cubeCode,
    },
    {
        label: 'Sphere',
        mode: '3d',
        code: sphereCode,
    },
    {
        label: 'Multiple 3D Shapes',
        mode: '3d',
        code: multiple3dShapesCode,
    },
    {
        label: 'Wave Grid',
        mode: '3d',
        code: waveGridCode,
    },
];
