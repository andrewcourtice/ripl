import {
    createAmbientLight,
    createDirectionalLight,
    createGroup3D,
    createParametric,
    createPointLight,
} from '@ripl/3d';

const TAU = Math.PI * 2;

function bezier(points, t) {
    const inv = 1 - t;

    return points[0] * inv * inv * inv
        + points[1] * 3 * inv * inv * t
        + points[2] * 3 * inv * t * t
        + points[3] * t * t * t;
}

// A profile spun around the Y axis: the body, lid and knob are all turned shapes.
function revolve(radii, heights) {
    return (u, v) => {
        const angle = u * TAU;
        const radius = bezier(radii, v);

        return [Math.cos(angle) * radius, bezier(heights, v), Math.sin(angle) * radius];
    };
}

// A circle swept along a curve in the XY plane: the spout and handle are both tubes.
function tube(xs, ys, radius) {
    return (u, v) => {
        const step = 1e-3;
        const dx = bezier(xs, Math.min(1, u + step)) - bezier(xs, Math.max(0, u - step));
        const dy = bezier(ys, Math.min(1, u + step)) - bezier(ys, Math.max(0, u - step));
        const length = Math.hypot(dx, dy) || 1;
        const angle = v * TAU;

        return [
            bezier(xs, u) + (-dy / length) * Math.cos(angle) * radius,
            bezier(ys, u) + (dx / length) * Math.cos(angle) * radius,
            Math.sin(angle) * radius,
        ];
    };
}

context.lights.clear();
context.lights.add(
    createAmbientLight({
        color: '#8899bb',
        intensity: 0.25,
    }),
    createDirectionalLight({
        direction: [-0.6, -0.8, -0.5],
        color: '#fff2e0',
        intensity: 0.75,
    }),
    createPointLight({
        position: [0, 3.5, 2],
        color: '#ffd0a0',
        intensity: 12,
        distance: 10,
    })
);

const material = {
    color: '#eae6dd',
    specular: '#ffffff',
    shininess: 48,
};

const parts = [
    revolve([0.5, 0.9, 1, 0.63], [0, 0.03, 0.7, 1.03]),
    revolve([0.68, 0.68, 0.33, 0.11], [1.03, 1.13, 1.18, 1.19]),
    revolve([0.11, 0.2, 0.2, 0], [1.19, 1.22, 1.36, 1.36]),
    tube([0.87, 1.4, 1.57, 1.67], [0.37, 0.4, 0.9, 1.07], 0.16),
    tube([-0.9, -1.53, -1.6, -0.9], [0.83, 0.87, 0.23, 0.27], 0.1),
];

scene.add(createGroup3D({
    y: -0.6,
    scale: 1.6,
    children: parts.map(surface => createParametric({
        surface,
        uSegments: 28,
        vSegments: 20,
        material,
    })),
}));

renderer.on('tick', event => {
    camera.orbit(event.data.deltaTime * 0.00018, 0);
});
