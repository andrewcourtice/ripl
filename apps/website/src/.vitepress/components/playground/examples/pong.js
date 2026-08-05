import {
    createCircle,
    createLine,
    createRect,
    createText,
} from '@ripl/web';

const STEP = 1 / 120;
const BALL_RADIUS = 7;
const PADDLE_WIDTH = 12;
const PADDLE_INSET = 28;
const PADDLE_SPEED = 950;
const RIVAL_SPEED = 280;
const RIVAL_REACTION = 0.14;
const RIVAL_ERROR = 1.4;
const MAX_BOUNCE = 1.05;
const SPEED_GAIN = 1.05;
const START_SPEED = 420;
const MAX_SPEED = 1150;
const SPARK_LIFE = 0.35;
const KEYS_UP = ['arrowup', 'w'];
const KEYS_DOWN = ['arrowdown', 's'];

const held = new Set();
const sweep = {
    enter: 0,
    exit: 1,
};

let pointerY = context.height / 2;
let usePointer = true;
let speed = START_SPEED;
let vx = START_SPEED;
let vy = 0;
let accumulator = 0;
let rivalTimer = 0;
let rivalTarget = 0;
let rivalError = 0;
let playerScore = 0;
let rivalScore = 0;
let sparkTime = 0;
let sparkX = 0;
let sparkY = 0;

const background = createRect({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fill: '#0b1120',
});

const net = createLine({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    stroke: '#334155',
    lineWidth: 4,
    lineDash: [14, 18],
});

const player = createRect({
    x: PADDLE_INSET,
    y: 0,
    width: PADDLE_WIDTH,
    height: 60,
    borderRadius: 6,
    fill: '#38bdf8',
});

const rival = createRect({
    x: 0,
    y: 0,
    width: PADDLE_WIDTH,
    height: 60,
    borderRadius: 6,
    fill: '#fb7185',
});

const ball = createCircle({
    cx: 0,
    cy: 0,
    radius: BALL_RADIUS,
    fill: '#f8fafc',
});

const score = createText({
    x: 0,
    y: 40,
    content: '0   0',
    fill: '#64748b',
    font: '600 32px monospace',
    textAlign: 'center',
    textBaseline: 'middle',
});

const hint = createText({
    x: 0,
    y: 0,
    content: 'Click here to steer with W / S or the arrow keys',
    fill: '#475569',
    font: '13px sans-serif',
    textAlign: 'center',
    textBaseline: 'middle',
});

const sparks = Array.from({ length: 10 }, () => createCircle({
    cx: 0,
    cy: 0,
    radius: 2.5,
    fill: '#fde68a',
    opacity: 0,
}));

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function layout() {
    const paddleHeight = Math.max(52, context.height * 0.22);

    background.width = context.width;
    background.height = context.height;
    net.x1 = context.width / 2;
    net.x2 = context.width / 2;
    net.y2 = context.height;
    player.height = paddleHeight;
    player.y = clamp(player.y, 0, context.height - paddleHeight);
    rival.height = paddleHeight;
    rival.x = context.width - PADDLE_INSET - PADDLE_WIDTH;
    rival.y = clamp(rival.y, 0, context.height - paddleHeight);
    score.x = context.width / 2;
    hint.x = context.width / 2;
    hint.y = context.height - 22;
}

function serve(direction) {
    const angle = (Math.random() - 0.5) * 0.6;

    ball.cx = context.width / 2;
    ball.cy = context.height / 2;
    speed = START_SPEED;
    vx = Math.cos(angle) * START_SPEED * direction;
    vy = Math.sin(angle) * START_SPEED;
    score.content = `${playerScore}   ${rivalScore}`;
}

function sweepAxis(origin, delta, min, max) {
    if (Math.abs(delta) < 1e-6) {
        return origin > min && origin < max;
    }

    const first = (min - origin) / delta;
    const second = (max - origin) / delta;

    sweep.enter = Math.max(sweep.enter, Math.min(first, second));
    sweep.exit = Math.min(sweep.exit, Math.max(first, second));

    return sweep.enter <= sweep.exit;
}

// Segment vs AABB: a step moves the ball up to 10px, so point-in-rect would step clean over a 12px paddle.
function sweepPaddle(paddle, dx, dy) {
    sweep.enter = 0;
    sweep.exit = 1;

    return sweepAxis(ball.cx, dx, paddle.x - BALL_RADIUS, paddle.x + PADDLE_WIDTH + BALL_RADIUS)
        && sweepAxis(ball.cy, dy, paddle.y - BALL_RADIUS, paddle.y + paddle.height + BALL_RADIUS);
}

function bounce(paddle, direction, dx, dy, dt) {
    const time = sweep.enter;

    ball.cx += dx * time;
    ball.cy += dy * time;

    // Where along the paddle the ball landed becomes the deflection angle: the "english" of the shot.
    const offset = clamp((ball.cy - paddle.y - paddle.height / 2) / (paddle.height / 2), -1, 1);

    speed = Math.min(speed * SPEED_GAIN, MAX_SPEED);
    vx = Math.cos(offset * MAX_BOUNCE) * speed * direction;
    vy = Math.sin(offset * MAX_BOUNCE) * speed;

    // A hit on the paddle's top or bottom edge lands inside its x span, where the ball would draw over it.
    const face = paddle.x + (direction > 0 ? PADDLE_WIDTH + BALL_RADIUS : -BALL_RADIUS);

    ball.cx = direction > 0 ? Math.max(ball.cx, face) : Math.min(ball.cx, face);
    ball.cx += vx * dt * (1 - time);
    ball.cy += vy * dt * (1 - time);
    sparkTime = SPARK_LIFE;
    sparkX = ball.cx;
    sparkY = ball.cy;
}

function moveBall(dt) {
    const dx = vx * dt;
    const dy = vy * dt;
    const hitPlayer = vx < 0 && sweepPaddle(player, dx, dy);
    const hitRival = vx > 0 && sweepPaddle(rival, dx, dy);

    if (hitPlayer || hitRival) {
        bounce(hitPlayer ? player : rival, hitPlayer ? 1 : -1, dx, dy, dt);
        return;
    }

    ball.cx += dx;
    ball.cy += dy;
}

function bounceWalls() {
    const bottom = Math.max(context.height - BALL_RADIUS, BALL_RADIUS);

    if (ball.cy < BALL_RADIUS) {
        ball.cy = 2 * BALL_RADIUS - ball.cy;
        vy = Math.abs(vy);
    } else if (ball.cy > bottom) {
        ball.cy = 2 * bottom - ball.cy;
        vy = -Math.abs(vy);
    }

    ball.cy = clamp(ball.cy, BALL_RADIUS, bottom);
}

function movePlayer(dt) {
    const limit = PADDLE_SPEED * dt;
    const center = player.y + player.height / 2;
    const up = KEYS_UP.some(key => held.has(key));
    const down = KEYS_DOWN.some(key => held.has(key));
    const target = usePointer ? pointerY : center + ((down ? 1 : 0) - (up ? 1 : 0)) * limit;

    player.y = clamp(player.y + clamp(target - center, -limit, limit), 0, context.height - player.height);
}

// Folding the flight into a triangle wave gives the intercept including every wall bounce on the way.
function predictIntercept() {
    if (vx <= 0) {
        return context.height / 2;
    }

    const range = Math.max(context.height - 2 * BALL_RADIUS, 1);
    const cycle = range * 2;
    const drift = ball.cy - BALL_RADIUS + (vy * (rival.x - ball.cx)) / vx;
    const folded = ((drift % cycle) + cycle) % cycle;

    return BALL_RADIUS + Math.min(folded, cycle - folded);
}

function moveRival(dt) {
    rivalTimer -= dt;

    // Resampling the aim error only while the ball heads away means one rally is played with one mistake.
    if (vx <= 0) {
        rivalError = (Math.random() - 0.5) * RIVAL_ERROR * rival.height;
    }

    if (rivalTimer <= 0) {
        rivalTimer = RIVAL_REACTION;
        rivalTarget = predictIntercept() + rivalError;
    }

    const limit = RIVAL_SPEED * dt;
    const delta = clamp(rivalTarget - rival.y - rival.height / 2, -limit, limit);

    rival.y = clamp(rival.y + delta, 0, context.height - rival.height);
}

function checkScore() {
    if (ball.cx > context.width + BALL_RADIUS) {
        playerScore += 1;
        serve(-1);
    } else if (ball.cx < -BALL_RADIUS) {
        rivalScore += 1;
        serve(1);
    }
}

function moveSparks(dt) {
    if (sparkTime <= 0) {
        return;
    }

    sparkTime -= dt;

    const progress = clamp(1 - sparkTime / SPARK_LIFE, 0, 1);

    sparks.forEach((spark, index) => {
        const angle = (index / sparks.length) * Math.PI * 2;

        spark.cx = sparkX + Math.cos(angle) * progress * 46;
        spark.cy = sparkY + Math.sin(angle) * progress * 46;
        spark.opacity = 1 - progress;
    });
}

layout();
player.y = (context.height - player.height) / 2;
rival.y = player.y;
serve(1);
scene.add([background, net, player, rival, ball, score, hint, ...sparks]);

renderer.on('tick', event => {
    // Clamping the frame stops a restored background tab dumping ten seconds of catch-up into one update.
    const frame = Math.min(event.data.deltaTime, 100) / 1000;

    accumulator += frame;

    while (accumulator >= STEP) {
        movePlayer(STEP);
        moveRival(STEP);
        moveBall(STEP);
        bounceWalls();
        checkScore();
        accumulator -= STEP;
    }

    moveSparks(frame);
});

context.on('mousemove', event => {
    pointerY = event.data.y;
    usePointer = true;
});

context.on('resize', () => {
    layout();
    serve(Math.sign(vx) || 1);
});

window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();

    if (key.startsWith('arrow')) {
        event.preventDefault();
    }

    held.add(key);
    usePointer = false;
    hint.opacity = 0;
});

window.addEventListener('keyup', event => held.delete(event.key.toLowerCase()));
