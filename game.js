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
let isPaused = false; // Pause state
let fireRate = 0.1; // Base fire rate (chance per frame)
let fireDirections = [{ angle: 0 }]; // Base: fire in ship's direction

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
    { name: "Wide Arc", type: "fireDirection", value: [{ angle: -25 }, { angle: 25 }], rarity: "Common", description: "Fire two streams at ±25°" },​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​