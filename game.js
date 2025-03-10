// Firebase Initialization
const firebaseConfig = {
    apiKey: "AIzaSyBHsHYGjohUTw5D2_CPlUBlmjoxMie-L5s",
    authDomain: "leader-board-216ac.firebaseapp.com",
    projectId: "leader-board-216ac",
    storageBucket: "leader-board-216ac.firebasestorage.app",
    messagingSenderId: "777301862678",
    appId: "1:777301862678:web:5b2a170163e9312f7c0837",
    measurementId: "G-CL0YJ2EEFE"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log('Firebase initialized:', app.name, db);

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
console.log('Canvas found:', canvas);
const ctx = canvas.getContext('2d');
if (!ctx) {
    console.error('Canvas context not initialized!');
    throw new Error('Canvas context not initialized');
}
console.log('Canvas context initialized:', ctx);
const moveArea = document.getElementById('move-area');
if (!moveArea) {
    console.error('Move area element not found! Check the id in index.html.');
    throw new Error('Move area not found');
}
console.log('Move area found:', moveArea);
const touchArea = document.getElementById('touch-area');
if (!touchArea) {
    console.error('Touch area element not found! Check the id in index.html.');
    throw new Error('Touch area not found');
}
console.log('Touch area found:', touchArea);
const upgradeScreen = document.getElementById('upgrade-screen');
const upgradeButtons = [
    document.getElementById('upgrade1'),
    document.getElementById('upgrade2'),
    document.getElementById('upgrade3')
];
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const playerNameInput = document.getElementById('player-name');
const submitScoreButton = document.getElementById('submit-score');
const leaderboardBody = document.getElementById('leaderboard-body');
const newGameButton = document.getElementById('new-game');

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    ship.x = canvas.clientWidth / 2;
    ship.y = canvas.clientHeight / 2;
    console.log('Canvas resized:', canvas.width, canvas.height, 'Ship position:', ship.x, ship.y);
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

const SMOOTHING_FRAMES = 5;
let touchYHistory = [];
let lastTouchY = 0;

const SHIP_SIZE = 20;
const ENEMY_SIZE = 15;
const PROJECTILE_SPEED = 5;
const BASE_ENEMY_SPAWN_RATE = 0.02;
const MOVE_SPEED = 10;
const MOVE_SENSITIVITY = 2;

let isTouchingSpin = false;
let touchXSpin = 0;
let isTouchingMove = false;
let touchXMove = 0;
let touchYMove = 0;

console.log('Game initialized. isPaused:', isPaused);

const upgrades = [
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

moveArea.addEventListener('touchstart', (e) => {
    isTouchingMove = true;
    touchXMove = e.touches[0].clientX;
    touchYMove = e.touches[0].clientY;
    console.log('Move touch started at:', touchXMove, touchYMove);
});
moveArea.addEventListener('touchmove', (e) => {
    touchXMove = e.touches[0].clientX;
    touchYMove = e.touches[0].clientY;
    console.log('Move touch moved to:', touchXMove, touchYMove);
});
moveArea.addEventListener('touchend', () => {
    isTouchingMove = false;
    console.log('Move touch ended');
});

touchArea.addEventListener('touchstart', (e) => {
    isTouchingSpin = true;
    touchXSpin = e.touches[0].clientY;
    lastTouchY = touchXSpin;
    touchYHistory = [touchXSpin];
    console.log('Spin touch started at:', touchXSpin);
});
touchArea.addEventListener('touchmove', (e) => {
    touchXSpin = e.touches[0].clientY;
    touchYHistory.push(touchXSpin);
    if (touchYHistory.length > SMOOTHING_FRAMES) touchYHistory.shift();
    console.log('Spin touch moved to:', touchXSpin);
});
touchArea.addEventListener('touchend', () => {
    isTouchingSpin = false;
    console.log('Spin touch ended');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') shipAngle += 0.1;
    if (e.key === 'ArrowRight') shipAngle -= 0.1;
});

function update(deltaTime) {
    if (!isPaused) {
        console.log('Update called, deltaTime:', deltaTime);
        timeLeft -= deltaTime / 1000;
        document.getElementById('timer').textContent = Math.ceil(timeLeft);

        if (timeLeft <= 0) {
            enemies = [];
            showUpgradeScreen();
        }

        if (isTouchingSpin && touchYHistory.length > 0) {
            const averageY = touchYHistory.reduce((a, b) => a + b) / touchYHistory.length;
            const moveY = (lastTouchY - averageY) * 0.02;
            shipAngle += moveY;
            lastTouchY = averageY;
            console.log('Ship angle updated to:', shipAngle);
        }

        if (isTouchingMove) {
            const moveAreaRect = moveArea.getBoundingClientRect();
            const moveZoneWidth = moveAreaRect.width;
            const moveZoneHeight = moveAreaRect.height;
            const centerX = moveAreaRect.left + moveZoneWidth / 2;
            const centerY = moveAreaRect.top + moveZoneHeight / 2;

            const touchOffsetX = ((touchXMove - centerX) / (moveZoneWidth / 2)) * MOVE_SENSITIVITY;
            const touchOffsetY = ((touchYMove - centerY) / (moveZoneHeight / 2)) * MOVE_SENSITIVITY;

            ship.x += touchOffsetX * MOVE_SPEED;
            ship.y += touchOffsetY * MOVE_SPEED;

            const visibleWidth = canvas.clientWidth;
            const visibleHeight = canvas.clientHeight;
            ship.x = Math.max(SHIP_SIZE, Math.min(visibleWidth - SHIP_SIZE, ship.x));
            ship.y = Math.max(SHIP_SIZE, Math.min(visibleHeight - SHIP_SIZE, ship.y));
            console.log('Ship moved to:', ship.x, ship.y, 'Touch offset:', touchOffsetX, touchOffsetY);
        }

        if (Math.random() < fireRate) {
            fireDirections.forEach(dir => {
                projectiles.push({
                    x: ship.x,
                    y: ship.y,
                    dx: Math.cos(shipAngle + dir.angle * (Math.PI / 180)) * PROJECTILE_SPEED,
                    dy: Math.sin(shipAngle + dir.angle * (Math.PI / 180)) * PROJECTILE_SPEED,
                });
            });
        }

        const maxAngleRange = Math.min((Math.PI / 2) * level, Math.PI * 2);
        const effectiveSpawnRate = BASE_ENEMY_SPAWN_RATE * (1 + (level - 1) * 0.3);

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
}

function draw() {
    console.log('Draw called');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    if (shields > 0) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';

        for (let i = 0; i < shields; i++) {
            const scaleFactor = 1 + (i * 0.15);
            const opacity = 1 - (i * 0.05);
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.moveTo(SHIP_SIZE * scaleFactor, 0);
            ctx.lineTo(-SHIP_SIZE / 2 * scaleFactor, SHIP_SIZE / 2 * scaleFactor);
            ctx.lineTo(-SHIP_SIZE / 2 * scaleFactor, -SHIP_SIZE / 2 * scaleFactor);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    ctx.restore();

    ctx.fillStyle = '#ffff00';
    projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

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
        console.log('Game loop running, isPaused:', isPaused);
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        update(deltaTime);
        draw();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Error in game loop:', error);
    }
}

function showUpgradeScreen() {
    isPaused = true;
    upgradeScreen.style.display = 'flex';
    const availableUpgrades = [];
    while (availableUpgrades.length < 3) {
        const upgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
        if (!availableUpgrades.includes(upgrade)) availableUpgrades.push(upgrade);
    }

    upgradeButtons.forEach((button, index) => {
        const upgrade = availableUpgrades[index];
        button.textContent = `${upgrade.name} (${upgrade.rarity})\n${upgrade.description}`;
        button.onclick = () => applyUpgrade(upgrade);
    });
}

function applyUpgrade(upgrade) {
    switch (upgrade.type) {
        case 'shields':
            shields += upgrade.value;
            break;
        case 'fireRate':
            fireRate += upgrade.value;
            break;
        case 'fireDirection':
            fireDirections = fireDirections.concat(upgrade.value);
            break;
    }
    document.getElementById('shields').textContent = shields;
    upgradeScreen.style.display = 'none';
    isPaused = false;
    levelUp();
}

function levelUp() {
    level++;
    timeLeft = 15;
    ship.x = canvas.clientWidth / 2;
    ship.y = canvas.clientHeight / 2;
    document.getElementById('level').textContent = level;
    document.getElementById('timer').textContent = timeLeft;
    spawnWedgeStartAngle = Math.random() * Math.PI * 2;
    console.log('Level up! New wedge start angle:', spawnWedgeStartAngle);
}

function gameOver() {
    isPaused = true;
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'flex';
    playerNameInput.value = '';
    loadLeaderboard();
}

function resetGame() {
    shields = 3;
    score = 0;
    level = 1;
    timeLeft = 15;
    enemies = [];
    projectiles = [];
    fireRate = 0.1;
    fireDirections = [{ angle: 0 }];
    spawnWedgeStartAngle = Math.random() * Math.PI * 2;
    ship.x = canvas.clientWidth / 2;
    ship.y = canvas.clientHeight / 2;
    document.getElementById('shields').textContent = shields;
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('timer').textContent = timeLeft;
    gameOverScreen.style.display = 'none';
    isPaused = false;
}

function saveScore() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert('Please enter a name!');
        return;
    }

    db.collection('scores').add({
        name: name,
        score: score,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        playerNameInput.value = '';
        submitScoreButton.disabled = true;
        loadLeaderboard();
    }).catch(error => {
        console.error('Error saving score:', error);
    });
}

function loadLeaderboard() {
    db.collection('scores')
        .orderBy('score', 'desc')
        .limit(10)
        .get()
        .then(querySnapshot => {
            leaderboardBody.innerHTML = '';
            let rank = 1;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${rank}</td>
                    <td>${data.name}</td>
                    <td>${data.score}</td>
                `;
                leaderboardBody.appendChild(row);
                rank++;
            });
        }).catch(error => {
            console.error('Error loading leaderboard:', error);
        });
}

submitScoreButton.addEventListener('click', saveScore);
newGameButton.addEventListener('click', resetGame);

loadLeaderboard();
requestAnimationFrame(gameLoop);