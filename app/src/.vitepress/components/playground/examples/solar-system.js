import {
    createCircle,
    createRect,
} from '@ripl/core';

const planets = [
    {
        name: 'Mercury',
        distance: 60,
        size: 4,
        speed: 0.04,
        color: '#A5A5A5',
    },
    {
        name: 'Venus',
        distance: 90,
        size: 7,
        speed: 0.015,
        color: '#E3BB76',
    },
    {
        name: 'Earth',
        distance: 130,
        size: 8,
        speed: 0.01,
        color: '#2271B3',
    },
    {
        name: 'Mars',
        distance: 170,
        size: 6,
        speed: 0.008,
        color: '#E27B58',
    },
    {
        name: 'Jupiter',
        distance: 240,
        size: 18,
        speed: 0.004,
        color: '#D39C7E',
    },
];

let centerX = context.width / 2;
let centerY = context.height / 2;

const background = createRect({
    x: 0,
    y: 0,
    width: context.width,
    height: context.height,
    fillStyle: '#000000',
});

const sun = createCircle({
    cx: centerX,
    cy: centerY,
    radius: 30,
    fillStyle: '#FFD700',
});

const planetElements = planets.map(data => ({
    data,
    path: createCircle({
        cx: centerX,
        cy: centerY,
        radius: data.distance,
        strokeStyle: '#333333',
    }),
    element: createCircle({
        cx: centerX + data.distance,
        cy: centerY,
        radius: data.size,
        fillStyle: data.color,
    }),
    angle: Math.random() * Math.PI * 2, // Random starting position
}));

scene.add([background, sun]);
scene.add(planetElements.flatMap(pe => [pe.path, pe.element]));

renderer.on('tick', () => {
    planetElements.forEach(p => {
        p.angle += p.data.speed;
        p.element.cx = centerX + p.data.distance * Math.cos(p.angle);
        p.element.cy = centerY + p.data.distance * Math.sin(p.angle);
    });
});

scene.on('resize', () => {
    centerX = context.width / 2;
    centerY = context.height / 2;

    sun.cx = centerX;
    sun.cy = centerY;
    background.width = context.width;
    background.height = context.height;

    planetElements.forEach(planet => {
        planet.path.cx = centerX;
        planet.path.cy = centerY;
    });
});