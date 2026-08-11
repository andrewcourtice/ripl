import {
    createAmbientLight,
    createDirectionalLight,
    createPointLight,
    createSphere,
    createSpotLight,
    createTorus,
} from '@ripl/3d';

// The default rig is one ambient plus one directional light; clearing it starts from nothing.
context.lights.clear();
context.lights.add(
    createAmbientLight({
        color: '#223355',
        intensity: 0.3,
    }),
    createDirectionalLight({
        direction: [-1, -1, -0.6],
        color: '#ffdcb0',
        intensity: 0.7,
    }),
    createPointLight({
        position: [2.5, 1, 2],
        color: '#ff5588',
        intensity: 14,
        distance: 9,
    }),
    createSpotLight({
        position: [0, 4, 0],
        direction: [0, -1, 0],
        color: '#66ddff',
        angle: 0.7,
        penumbra: 0.6,
        intensity: 25,
    })
);

scene.add([
    createSphere({
        radius: 1,
        segments: 40,
        rings: 28,
        fill: '#e8e8e8',
    }),
    createTorus({
        y: -0.95,
        radius: 1.8,
        tube: 0.14,
        radialSegments: 12,
        tubularSegments: 48,
        fill: '#99a4b5',
    }),
]);

renderer.on('tick', event => {
    camera.orbit(event.data.deltaTime * 0.0002, 0);
});
