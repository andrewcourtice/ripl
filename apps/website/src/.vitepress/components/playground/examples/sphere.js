import {
    createSphere,
} from '@ripl/3d';

const sphere = createSphere({
    radius: 0.8,
    segments: 32,
    fill: '#6366f1',
});

scene.add(sphere);