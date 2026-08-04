import {
    createCircle,
    createText,
} from '@ripl/web';

const POOL_SIZE = 420;
const SPAWN_RATE = 240;
const GRAVITY = 900;
const LIFETIME = 2.2;
const POINTER_FORCE = 3.2e6;
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22d3ee'];

const pointer = {
    x: 0,
    y: 0,
    active: false,
    repel: false,
};

const particles = Array.from({ length: POOL_SIZE }, () => ({
    element: createCircle({
        cx: 0,
        cy: 0,
        radius: 3,
        fill: COLORS[0],
        opacity: 0,
    }),
    vx: 0,
    vy: 0,
    life: 0,
}));

const hint = createText({
    x: 16,
    y: 16,
    content: 'Move the pointer to attract, click to repel',
    fill: '#94a3b8',
    font: '13px sans-serif',
    textBaseline: 'top',
});

let originX = context.width / 2;
let originY = context.height * 0.92;
let spawnCredit = 0;

function spawn(particle) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const speed = 420 + Math.random() * 340;
    const { element } = particle;

    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.life = LIFETIME * (0.55 + Math.random() * 0.45);

    element.cx = originX;
    element.cy = originY;
    element.radius = 2 + Math.random() * 3;
    element.fill = COLORS[Math.floor(Math.random() * COLORS.length)];
    element.opacity = 1;
}

function getPointerForce() {
    if (!pointer.active) {
        return 0;
    }

    return pointer.repel ? -POINTER_FORCE : POINTER_FORCE;
}

function step(particle, dt) {
    const { element } = particle;
    const dx = pointer.x - element.cx;
    const dy = pointer.y - element.cy;
    const dist = Math.sqrt(dx * dx + dy * dy) + 24;
    const pull = getPointerForce() / (dist * dist * dist);

    particle.vx += dx * pull * dt;
    particle.vy += (dy * pull + GRAVITY) * dt;

    element.cx += particle.vx * dt;
    element.cy += particle.vy * dt;
    element.opacity = Math.min(1, particle.life / (LIFETIME * 0.4));
}

// The pool is added once: every add or remove rebuilds the scene's whole instruction list.
scene.add(particles.map(particle => particle.element));
scene.add(hint);

renderer.on('tick', event => {
    const dt = Math.min(event.data.deltaTime / 1000, 0.05);

    spawnCredit += dt * SPAWN_RATE;

    particles.forEach(particle => {
        if (particle.life > 0) {
            particle.life -= dt;

            if (particle.life <= 0) {
                particle.element.opacity = 0;
                return;
            }

            step(particle, dt);
            return;
        }

        if (spawnCredit >= 1) {
            spawnCredit -= 1;
            spawn(particle);
        }
    });
});

context.on('mousemove', event => {
    pointer.x = event.data.x;
    pointer.y = event.data.y;
    pointer.active = true;
});

context.on('mouseleave', () => {
    pointer.active = false;
});

context.on('click', () => {
    pointer.repel = !pointer.repel;
});

context.on('resize', () => {
    originX = context.width / 2;
    originY = context.height * 0.92;
});
