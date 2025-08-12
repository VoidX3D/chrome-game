const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Scale canvas for mobile (device pixel ratio)
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 900 * dpr;
  canvas.height = 300 * dpr;
  canvas.style.width = '900px';
  canvas.style.height = '300px';
  ctx.scale(dpr, dpr);
}
setupCanvas();

let gravity = 0.6;
let baseSpeed = 6;
let jumpPower = -12;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;
let frameCount = 0;
let isNight = false;
let skyGradient;

// Dino state
const dino = {
  x: 50,
  y: 200,
  width: 44,
  height: 47,
  dy: 0,
  grounded: true,
  ducking: false,
  frame: 0,
  frameDelay: 5,
  sprite: null
};

// Load images helper
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// Assets
const dinoRun = [loadImage('assets/dino-run1.png'), loadImage('assets/dino-run2.png')];
const dinoDuck = [loadImage('assets/dino-duck1.png'), loadImage('assets/dino-duck2.png')];
const dinoJump = loadImage('assets/dino-jump.png');

const cactusImgs = [loadImage('assets/cactus1.png'), loadImage('assets/cactus2.png')];
const birdImgs = [loadImage('assets/bird1.png'), loadImage('assets/bird2.png')];
const crowImgs = [loadImage('assets/crow1.png'), loadImage('assets/crow2.png')];
const tumbleweedImg = loadImage('assets/tumbleweed.png');

const groundImg = loadImage('assets/ground.png');
const cloudImg = loadImage('assets/cloud.png');
const moonImg = loadImage('assets/moon.png');

// Game objects
let obstacles = [];
let clouds = [];
let birds = [];
let crows = [];
let tumbleweeds = [];

let speed = baseSpeed;

// Controls
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameOver) jump();
  if (e.code === 'ArrowDown') duck(true);
  if (gameOver && (e.code === 'Space' || e.code === 'ArrowUp')) resetGame();
});
document.addEventListener('keyup', e => {
  if (e.code === 'ArrowDown') duck(false);
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  jump();
});
canvas.addEventListener('touchend', e => {
  duck(false);
});

// Jump function
function jump() {
  if (dino.grounded && !gameOver) {
    dino.dy = jumpPower;
    dino.grounded = false;
  }
  if (gameOver) resetGame();
}

// Duck function
function duck(state) {
  dino.ducking = state;
  dino.height = state ? 25 : 47;
  if (state) dino.y = 222;  // Adjust y when ducking to avoid sinking into ground
  else dino.y = 200;
}

// Reset game state
function resetGame() {
  obstacles = [];
  clouds = [];
  birds = [];
  crows = [];
  tumbleweeds = [];
  score = 0;
  speed = baseSpeed;
  gameOver = false;
  dino.y = 200;
  dino.height = 47;
  dino.grounded = true;
  dino.ducking = false;
}

// Spawn functions
function spawnObstacle() {
  const img = cactusImgs[Math.floor(Math.random() * cactusImgs.length)];
  obstacles.push({
    img,
    x: canvas.width / (window.devicePixelRatio || 1),
    y: 253 - img.height,
    width: img.width,
    height: img.height
  });
}

function spawnCloud() {
  clouds.push({
    x: canvas.width / (window.devicePixelRatio || 1),
    y: Math.random() * 80,
    speed: 2
  });
}

function spawnBird() {
  birds.push({
    frame: 0,
    x: canvas.width / (window.devicePixelRatio || 1),
    y: Math.random() > 0.5 ? 180 : 120,
    speed: 6
  });
}

function spawnCrow() {
  const heights = [120, 180]; // low (duck needed), high (jump possible)
  crows.push({
    frame: 0,
    x: canvas.width / (window.devicePixelRatio || 1),
    y: heights[Math.floor(Math.random() * heights.length)],
    speed: 6
  });
}

function spawnTumbleweed() {
  tumbleweeds.push({
    x: canvas.width / (window.devicePixelRatio || 1),
    y: 235,
    speed: 4
  });
}

// Main update loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frameCount++;

  // Day/Night toggle every 600 frames (~10 seconds at 60fps)
  if (frameCount % 600 === 0) isNight = !isNight;

  // Background gradient
  skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / (window.devicePixelRatio || 1));
  if (isNight) {
    skyGradient.addColorStop(0, '#001d3d');
    skyGradient.addColorStop(1, '#003566');
  } else {
    skyGradient.addColorStop(0, '#87ceeb');
    skyGradient.addColorStop(1, '#ffffff');
  }
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

  // Draw moon at night
  if (isNight) ctx.drawImage(moonImg, 800, 30, 60, 60);

  // Draw clouds
  clouds.forEach(c => {
    c.x -= c.speed;
    ctx.drawImage(cloudImg, c.x, c.y, cloudImg.width, cloudImg.height);
  });
  clouds = clouds.filter(c => c.x + cloudImg.width > 0);

  // Draw birds
  birds.forEach(b => {
    b.x -= b.speed;
    b.frame = (frameCount % 20 < 10) ? 0 : 1;
    ctx.drawImage(birdImgs[b.frame], b.x, b.y, 46, 40);
  });
  birds = birds.filter(b => b.x + 46 > 0);

  // Draw crows (hazard)
  crows.forEach(c => {
    c.x -= c.speed;
    c.frame = (frameCount % 20 < 10) ? 0 : 1;
    ctx.drawImage(crowImgs[c.frame], c.x, c.y, 46, 30);

    // Collision detection with crow
    if (
      dino.x < c.x + 46 &&
      dino.x + dino.width > c.x &&
      dino.y < c.y + 30 &&
      dino.y + dino.height > c.y
    ) {
      gameOver = true;
    }
  });
  crows = crows.filter(c => c.x + 46 > 0);

  // Draw tumbleweeds (harmless)
  tumbleweeds.forEach(t => {
    t.x -= t.speed;
    ctx.drawImage(tumbleweedImg, t.x, t.y, tumbleweedImg.width, tumbleweedImg.height);
  });
  tumbleweeds = tumbleweeds.filter(t => t.x + tumbleweedImg.width > 0);

  // Draw obstacles (cacti)
  obstacles.forEach(o => {
    o.x -= speed;
    ctx.drawImage(o.img, o.x, o.y, o.width, o.height);

    // Collision detection with cactus
    if (
      dino.x < o.x + o.width &&
      dino.x + dino.width > o.x &&
      dino.y < o.y + o.height &&
      dino.y + dino.height > o.y
    ) {
      gameOver = true;
    }
  });
  obstacles = obstacles.filter(o => o.x + o.width > 0);

  // Dino physics
  dino.y += dino.dy;
  dino.dy += gravity;

  if (dino.y >= 200) {
    dino.y = 200;
    dino.dy = 0;
    dino.grounded = true;
  }

  // Dino animation frame
  if (dino.ducking) {
    dino.sprite = dinoDuck[Math.floor(frameCount / dino.frameDelay) % 2];
  } else if (!dino.grounded) {
    dino.sprite = dinoJump;
  } else {
    dino.sprite = dinoRun[Math.floor(frameCount / dino.frameDelay) % 2];
  }

  // Draw dino sprite with scaling
  ctx.drawImage(dino.sprite, dino.x, dino.y, dino.width, dino.height);

  // Draw ground (repeating)
  for (let i = 0; i < Math.ceil(canvas.width / groundImg.width); i++) {
    ctx.drawImage(groundImg, i * groundImg.width, 253);
  }

  // Score and speed updates
  if (!gameOver) {
    score += 0.05;
    speed += 0.001; // gradually increase speed
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
    }
  }

  // Draw score
  ctx.fillStyle = isNight ? '#fff' : '#000';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  ctx.fillText('High Score: ' + Math.floor(highScore), canvas.width / (window.devicePixelRatio || 1) - 170, 20);

  // Game over text
  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '30px Arial';
    ctx.fillText('Game Over! Tap or Press Space to Restart', 150, 150);
  }

  requestAnimationFrame(update);
}

// Spawn intervals
setInterval(spawnObstacle, 1500);
setInterval(spawnCloud, 3000);
setInterval(spawnBird, 5000);
setInterval(spawnCrow, 4500);
setInterval(spawnTumbleweed, 5000);

// Register Service Worker if available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Start game loop
update();