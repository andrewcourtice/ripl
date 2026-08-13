import {
    createAmbientLight,
    createDirectionalLight,
    createSphere,
} from '@ripl/3d';

const SHININESS = [0, 8, 32, 128];
const COLORS = ['#b87333', '#c0c0c0', '#5c9e78', '#7f9ec4'];

context.lights.clear();
context.lights.add(
    createAmbientLight({
        intensity: 0.25,
    }),
    createDirectionalLight({
        direction: [-0.6, -0.8, -0.6],
        intensity: 0.85,
    })
);

scene.add(SHININESS.map((shininess, index) => createSphere({
    x: index % 2 === 0 ? -0.8 : 0.8,
    y: index < 2 ? 0.8 : -0.8,
    radius: 0.6,
    segments: 36,
    rings: 24,
    material: {
        color: COLORS[index],
        specular: '#ffffff',
        shininess,
    },
})));

renderer.on('tick', event => {
    camera.orbit(event.data.deltaTime * 0.00015, 0);
});
