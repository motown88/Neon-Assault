// Declare ship before resizeCanvas
const ship = {
    x: 0, // Will be set in resizeCanvas
    y: 0,
    radius: 20,
};

const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    console.error('Canvas element not found! Check the id in index.html and script loading order.');
    throw new Error('Canvas not found');
}
const ctx = canvas.getContext('2d');
const touchArea = document.getElementById('touch-area'); // Note: hyphen in id

// Set canvas size
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    // Update ship position to center
    ship.x = canvas.clientWidth / 2;
    ship.y = canvas.clientHeight / 2;
    console.log('Canvas resized:', canvas.width, canvas.height); // Debug: Check canvas size
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let shipAngle = 0;
let shields = 3;
let score = 0;
let level = 1;
let timeLeft = 30;
let enemies = [];
let projectiles = [];
let lastFrameTime = performance.now();

const SHIP_SIZE = 20;
const ENEMY_SIZE = 15;
const PROJECTILE_SPEED = 5;

// Input handling
let isTouching = false;
let touchX = 0;

touchArea.addEventListener('touchstart', (e) => {
    isTouching = true;
    touchX = e.touches[0].clientX;
});
touchArea.addEventListener('touchmove', (e) => {
    touchX = e.touches[0].clientX;
});
touchArea.addEventListener('touchend', () => isTouching = false);

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') shipAngle += 0.1;
    if (e.key === 'ArrowRight') shipAngle -= 0.1;
});

// Game loop
function update(deltaTime) {
    // Update timer
    timeLeft -= deltaTime / 1000;
    document.getElementById('timer').textContent = Math.ceil(timeLeft);

    if (timeLeft <= 0) {
        levelUp();
    }

    // Rotate ship based on touch
    if (isTouching) {
        const touchZoneWidth = touchArea.clientWidth;
        shipAngle = -((touchX / touchZoneWidth) - 0.5) * Math.PI * 2;
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

    // Spawn enemies
    if (Math.random() < 0.02 * level) {
        const angle = Math.random() * Math.PI * 2;
        const spawnDistance = Math.max(canvas.width, canvas.height);
        enemies.push({
            x: ship.x + Math.cos(angle) * spawnDistance,
            y: ship.y + Math.sin(angle) * spawnDistance,
            speed: 1 + level * 0.5,
        });
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

        // Collision with ship
        if (dist < ship.radius + ENEMY_SIZE) {
            enemies.splice(i, 1);
            shields--;
            document.getElementById('shields').textContent = shields;
            if (shields <= 0) gameOver();
        }

        // Collision with projectiles
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
    console.log('Drawing frame'); // Debug: Check if draw is called
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

    // Draw enemies
    ctx.fillStyle = '#ff0000';
    enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, ENEMY_SIZE, 0, Math.PI * 2);
        ctx.fill();
    });
}

function gameLoop(currentTime) {
    try {
        console.log('Game loop running'); // Debug: Check if loop is running
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
}

function gameOver() {
    alert(`Game Over! Score: ${score}`);
    shields = 3;
    score = 0;
    level = 1;
    timeLeft = 30;
    enemies = [];
    projectiles = [];
    document.getElementById('shields').textContent = shields;
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('timer').textContent = timeLeft;
}

requestAnimationFrame(gameLoop);