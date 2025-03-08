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
const upgradeScreen = document.getElementById('upgrade-screen');
const upgradeButtons = [
    document.getElementById('upgrade1'),
    document.getElementById('upgrade2'),
    document.getElementById('upgrade3')
];

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
let spawnWedgeStartAngle = Math.random() * Math.PI * 2;
let isPaused = false;
let fireRate = 0.1;
let fireDirections = [{ angle: 0 }];

const SHIP_SIZE = 20;
const ENEMY_SIZE = 15;
const PROJECTILE_SPEED = 5;
const BASE_ENEMY_SPAWN_RATE = 0.02;

let isTouching = false;
let touchX = 0;

// Define 30 upgrades
const upgrades = [
    // Shield Upgrades
    { name: "Shield Boost", type: "shields", value: 1, rarity: "Common", description: "+1 Shield" },
    { name: "Energy Barrier", type: "shields", value: 2, rarity: "Rare", description: "+2 Shields" },
    { name: "Neon Fortress", type: "shields", value: 3, rarity: "Epic", description: "+3 Shields" },
    { name: "Deflector Plate", type: "shields", value: 1, rarity: "Common", description: "+1 Shield" },
    { name: "Plasma Shell", type: "shields", value: 2, rarity: "Rare", description: "+2 Shields" },
    { name: "Quantum Guard", type: "shields", value: 3, rarity: "Epic", description: "+3 Shields" },
    { name: "Hard Light Shield", type: "shields", value: 1, rarity: "Common", description: "+1 Shield" },
    { name: "Aegis Protocol", type: "shields", value: 2, rarity: "Rare", description: "+2 Shields" },
    { name: "Titan Armor", type: "shields", value: 3, rarity: "Epic", description: "+3 Shields" },
    { name: "Reactive Plating", type: "shields", value: 1, rarity: "Common", description: "+1 Shield" },

    // Fire Rate Upgrades
    { name: "Rapid Fire", type: "fireRate", value: 0.05, rarity: "Common", description: "+5% Fire Rate" },
    { name: "Turbo Blaster", type: "fireRate", value: 0.1, rarity: "Rare", description: "+10% Fire Rate" },
    { name: "Hyper Volley", type: "fireRate", value: 0.15, rarity: "Epic", description: "+15% Fire Rate" },
    { name: "Quick Shot", type: "fireRate", value: 0.05, rarity: "Common", description: "+5% Fire Rate" },
    { name: "Pulse Accelerator", type: "fireRate", value: 0.1, rarity: "Rare", description: "+10% Fire Rate" },
    { name: "Nova Burst", type: "fireRate", value: 0.15, rarity: "Epic", description: "+15% Fire Rate" },
    { name: "Swift Barrage", type: "fireRate", value: 0.05, rarity: "Common", description: "+5% Fire Rate" },
    { name: "Ion Overdrive", type: "fireRate", value: 0.1, rarity: "Rare", description: "+10% Fire Rate" },
    { name: "Starfire Surge", type: "fireRate", value: 0.15, rarity: "Epic", description: "+15% Fire Rate" },
    { name: "Blaster Tune-Up", type: "fireRate", value: 0.05, rarity: "Common", description: "+5% Fire Rate" },

    // Firing Direction Upgrades
    { name: "Dual Shot", type: "fireDirection", value: [{ angle: -15 }, { angle: 15 }], rarity: "Common", description: "Fire two streams at ±15°" },
    { name: "Triad Beam", type: "fireDirection", value: [{ angle: -30 }, { angle: 0 }, { angle: 30 }], rarity: "Rare", description: "Fire three streams at ±30°" },
    { name: "Omni Blast", type: "fireDirection", value: [{ angle: 0 }, { angle: 180 }], rarity: "Epic", description: "Fire front and back" },
    { name: "Spread Shot", type: "fireDirection", value: [{ angle: -20 }, { angle: 20 }], rarity: "Common", description: "Fire two streams at ±20°" },
    { name: "Quad Volley", type: "fireDirection", value: [{ angle: -45 }, { angle: -15 }, { angle: 15 }, { angle: 45 }], rarity: "Rare", description: "Fire four streams at ±15°, ±45°" },
    { name: "Star Burst", type: "fireDirection", value: [{ angle: 0 }, { angle: 90 }, { angle: 180 }, { angle: 270 }], rarity: "Epic", description: "Fire in all four directions" },
    { name: "Fan Fire", type: "fireDirection", value: [{ angle: -10 }, { angle: 10 }], rarity: "Common", description: "Fire two streams at ±10°" },
    { name: "Crossfire", type: "fireDirection", value: [{ angle: -90 }, { angle: 90 }], rarity: "Rare", description: "Fire to both sides" },
    { name: "Penta Strike", type: "fireDirection", value: [{ angle: -60 }, { angle: -30 }, { angle: 0 }, { angle: 30 }, { angle: 60 }], rarity: "Epic", description: "Fire five streams at ±30°, ±60°" },
    { name: "Wide Arc", type: "fireDirection", value: [{ angle: -25 }, { angle: 25 }], rarity: "Common", description: "Fire two streams at ±25°" },
];

function getRandomUpgrades() {
    const shuffled = upgrades.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

function showUpgradeScreen() {
    isPaused = true;
    upgradeScreen.style.display = 'flex';
    const selectedUpgrades = getRandomUpgrades();

    upgradeButtons.forEach((button, index) => {
        const upgrade = selectedUpgrades[index];
        button.textContent = `${upgrade.name} (${upgrade.rarity}) - ${upgrade.description}`;
        button.onclick = () => {
            applyUpgrade(upgrade);
            upgradeScreen.style.display = 'none';
            isPaused = false;
            levelUp();
            requestAnimationFrame(gameLoop);
        };
    });
}

function applyUpgrade(upgrade) {
    if (upgrade.type === "shields") {
        shields += upgrade.value;
        document.getElementById('shields').textContent = shields;
    } else if (upgrade.type === "fireRate") {
        fireRate += upgrade.value;
        fireRate = Math.min(fireRate, 0.5);
    } else if (upgrade.type === "fireDirection") {
        fireDirections = upgrade.value;
    }
    console.log('Applied upgrade:', upgrade.name, 'New state:', { shields, fireRate, fireDirections });
}

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
    if (isPaused) return;

    timeLeft -= deltaTime / 1000;
    document.getElementById('timer').textContent = Math.ceil(timeLeft);

    if (timeLeft <= 0) {
        showUpgradeScreen();
        return;
    }

    if (isTouching) {
        const touchZoneWidth = touchArea.clientWidth;
        shipAngle = -((touchX / touchZoneWidth) - 0.5) * Math.PI * 4;
        console.log('Ship angle updated to:', shipAngle);
    }

    if (Math.random() < fireRate) {
        fireDirections.forEach(direction => {
            const angle = shipAngle + (direction.angle * Math.PI / 180);
            projectiles.push({
                x: ship.x,
                y: ship.y,
                dx: Math.cos(angle) * PROJECTILE_SPEED,
                dy: Math.sin(angle) * PROJECTILE_SPEED,
            });
        });
    }

    const maxAngleRange = Math.min((Math.PI / 2) * level, Math.PI * 2);
    const effectiveSpawnRate = BASE_ENEMY_SPAWN_RATE * (1 + (level - 1) * 0.5);

    if (Math.random() < effectiveSpawnRate) {
        const angleRange = maxAngleRange / 2;
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

    projectiles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            projectiles.splice(i, 1);
        }
    });

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
        if (!isPaused) requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Error in game loop:', error);
    }
}

function levelUp() {
    level++;
    timeLeft = 30;
    document.getElementById('level').textContent = level;
    document.getElementById('timer').textContent = timeLeft;
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
    fireRate = 0.1;
    fireDirections = [{ angle: 0 }];
    spawnWedgeStartAngle = Math.random() * Math.PI * 2;
    document.getElementById('shields').textContent = shields;
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('timer').textContent = timeLeft;
}

requestAnimationFrame(gameLoop);