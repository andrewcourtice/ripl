import animationCode from './animation.js?raw';
import circleCode from './circle.js?raw';
import cubeCode from './cube.js?raw';
import multiple3dShapesCode from './multiple-3d-shapes.js?raw';
import multipleShapesCode from './multiple-shapes.js?raw';
import rectangleCode from './rectangle.js?raw';
import sphereCode from './sphere.js?raw';
import textCode from './text.js?raw';
import solarSystemCode from './solar-system.js?raw';

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
];
