const ship = {
    x: 0,
    y: 0,
    radius: 20,
};

const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    console.error('Canvas element not found! Check the id in index.html and script loading order.');
    throw new Error('Canvas not found');
}
const ctx = canvas.getContext('2d');
const touchArea = document.getElementById('touch-area');

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    ship.x = canvas.clientWidth / 2;
    ship.y = canvas.clientHeight / 2;
    console.log('Canvas resized:', canvas.width, canvas.height);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let shipAngle = 0;
let shields = 3;
let score = 0;
let level = 1;
let timeLeft = 15;
let enemies = [];
let projectiles = [];
let lastFrameTime = performance.now();
let spawnWedgeStartAngle = Math.random() * Math.PI * 2; // Random starting angle for the wedge

const SHIP_SIZE = 20;
const ENEMY_SIZE = 15;
const PROJECTILE_SPEED = 5;
const BASE_ENEMY_SPAWN_RATE = 0.02;

let isTouching = false;
let touchX = 0;

touchArea.addEventListener('touchstart', (e) => {
    isTouching = true;
    touchX = e.touches[0].clientX;
    console.log('Touch started at:', touchX);
});
touchArea.addEventListener('touchmove', (e) => {
    touchX = e.touches[0].clientX;
    console.log('Touch moved to:', touchX);
});
touchArea.addEventListener('touchend', () => {
    isTouching = false;
    console.log('Touch ended');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') shipAngle += 0.1;
    if (e.key === 'ArrowRight') shipAngle -= 0.1;
});

function update(deltaTime) {
    timeLeft -= deltaTime / 1000;
    document.getElementById('timer').textContent = Math.ceil(timeLeft);

    if (timeLeft <= 0) {
        levelUp();
    }

    // Increase touch sensitivity: complete a full rotation with smaller movement
    if (isTouching) {
        const touchZoneWidth = touchArea.clientWidth;
        // Map touch position (0 to touchZoneWidth) to a larger angle change
        // Previously: full width = 2π (360 degrees)
        // Now: half width = 2π (so full width = 4π, doubling sensitivity)
        shipAngle = -((touchX / touchZoneWidth) - 0.5) * Math.PI * 4; // Doubled sensitivity
        console.log('Ship angle updated to:', shipAngle);
    }

    // Auto-fire projectiles
    if (Math.random() < 0.1) {
        projectiles.push({
            x: ship.x,
            y: ship.y,
            dx: Math.cos(shipAngle) * PROJECTILE_SPEED,
            dy: Math.sin(shipAngle) * PROJECTILE_SPEED,
        });
    }

    // Calculate spawn angle range based on level
    const maxAngleRange = Math.min((Math.PI / 2) * level, Math.PI * 2); // 90 degrees per level, max 360 degrees
    const effectiveSpawnRate = BASE_ENEMY_SPAWN_RATE * (1 + (level - 1) * 0.5); // Slower progression

    // Spawn enemies within the angle range
    if (Math.random() < effectiveSpawnRate) {
        const angleRange = maxAngleRange / 2; // Half range on either side of start angle
        const angle = spawnWedgeStartAngle + (Math.random() * maxAngleRange - angleRange);
        const spawnDistance = canvas.width * 0.7;
        const enemy = {
            x: ship.x + Math.cos(angle) * spawnDistance,
            y: ship.y + Math.sin(angle) * spawnDistance,
            speed: 1 + (level - 1) * 0.5,
        };
        enemies.push(enemy);
        console.log('Enemy spawned at:', enemy.x, enemy.y, 'with speed:', enemy.speed, 'angle:', angle);
    }

    // Update projectiles
    projectiles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            projectiles.splice(i, 1);
        }
    });

    // Update enemies
    enemies.forEach((e, i) => {
        const dx = ship.x - e.x;
        const dy = ship.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        e.x += (dx / dist) * e.speed;
        e.y += (dy / dist) * e.speed;
        console.log('Enemy at:', e.x, e.y, 'distance to ship:', dist);

        if (dist < ship.radius + ENEMY_SIZE) {
            enemies.splice(i, 1);
            shields--;
            document.getElementById('shields').textContent = shields;
            if (shields <= 0) gameOver();
        }

        projectiles.forEach((p, pi) => {
            if (Math.hypot(p.x - e.x, p.y - e.y) < ENEMY_SIZE) {
                enemies.splice(i, 1);
                projectiles.splice(pi, 1);
                score += 10;
                document.getElementById('score').textContent = score;
            }
        });
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(shipAngle);
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE / 2, SHIP_SIZE / 2);
    ctx.lineTo(-SHIP_SIZE / 2, -SHIP_SIZE / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw projectiles
    ctx.fillStyle = '#ffff00';
    projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemies with neon effect
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff00ff';
    enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, ENEMY_SIZE, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;
}

function gameLoop(currentTime) {
    try {
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        update(deltaTime);
        draw();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Error in game loop:', error);
    }
}

function levelUp() {
    level++;
    timeLeft = 30;
    document.getElementById('level').textContent = level;
    document.getElementById('timer').textContent = timeLeft;
    // Change the wedge start angle for the new level
    spawnWedgeStartAngle = Math.random() * Math.PI * 2;
    console.log('Level up! New wedge start angle:', spawnWedgeStartAngle);
}

function gameOver() {
    alert(`Game Over! Score: ${score}`);
    shields = 3;
    score = 0;
    level = 1;
    timeLeft = 15;
    enemies = [];
    projectiles = [];
    spawnWedgeStartAngle = Math.random() * Math.PI * 2;
    document.getElementById('shields').textContent = shields;
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('timer').textContent = timeLeft;
}

requestAnimationFrame(gameLoop);