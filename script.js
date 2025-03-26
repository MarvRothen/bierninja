
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let bottles = [];
let hits = [];
let slices = [];
let combos = [];
let splashes = [];
let lives = 3;
let score = 0;
let gameOver = false;
let win = false;

const bier = new Image(); bier.src = 'bierflasche.png';
const wasser = new Image(); wasser.src = 'wasserflasche.png';
const boss = new Image(); boss.src = 'endgegner.png';
const hitSound = new Audio('hit.mp3');

canvas.addEventListener('click', sliceHandler);
canvas.addEventListener('touchstart', (e) => sliceHandler(e.touches[0]));

function sliceHandler(e) {
  if (gameOver || win) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  slices.push({ x, y, time: Date.now() });

  let hitCount = 0;

  for (let i = bottles.length - 1; i >= 0; i--) {
    let b = bottles[i];
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) {
      if (b.type === 'bier') {
        score++;
        hits.push({ x: b.x + 20, y: b.y, opacity: 1.0 });
        splashes.push({ x: b.x, y: b.y, time: Date.now() });
        hitSound.currentTime = 0;
        hitSound.play();
        hitCount++;
        if (score >= 1995) {
          win = true;
          document.getElementById('winScreen').style.display = 'flex';
        }
      } else if (b.type === 'wasser') {
        lives--;
        if (lives <= 0) {
          gameOver = true;
          document.getElementById('gameOverScreen').style.display = 'flex';
        }
      } else if (b.type === 'endgegner') {
        score = 0;
      }
      bottles.splice(i, 1);
    }
  }

  if (hitCount > 1) {
    combos.push({ x, y, value: hitCount, opacity: 1.0 });
  }
}

function spawnBottle() {
  if (gameOver || win) return;
  let typeChance = Math.random();
  let type = 'bier';
  if (typeChance > 0.6) type = 'wasser';
  if (typeChance > 0.75) type = 'endgegner';

  let edge = Math.floor(Math.random() * 4);
  let startX = 0, startY = 0, vx = 0, vy = 0;
  const speed = Math.random() * 5 + 4;

  switch (edge) {
    case 0:
      startX = Math.random() * canvas.width;
      startY = canvas.height + 50;
      vx = (Math.random() - 0.5) * 6;
      vy = -speed;
      break;
    case 1:
      startX = Math.random() * canvas.width;
      startY = -50;
      vx = (Math.random() - 0.5) * 6;
      vy = speed;
      break;
    case 2:
      startX = -50;
      startY = Math.random() * canvas.height;
      vx = speed;
      vy = (Math.random() - 0.5) * 6;
      break;
    case 3:
      startX = canvas.width + 50;
      startY = Math.random() * canvas.height;
      vx = -speed;
      vy = (Math.random() - 0.5) * 6;
      break;
  }

  const size = type === 'endgegner' ? [80, 160] : type === 'bier' ? [75, 180] : [65, 150];

  bottles.push({ x: startX, y: startY, vx, vy, w: size[0], h: size[1], type, angle: 0 });
  setTimeout(spawnBottle, 800);
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let now = Date.now();

  // Draw splashes
  splashes = splashes.filter(s => now - s.time < 300);
  splashes.forEach(s => {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(s.x + 40, s.y + 90, 50, 0, 2 * Math.PI);
    ctx.fill();
  });

  for (let i = bottles.length - 1; i >= 0; i--) {
    let b = bottles[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.2;
    b.angle = (b.angle || 0) + 0.05;

    if (b.y > canvas.height + 200 || b.y + b.h < -200 || b.x + b.w < -200 || b.x > canvas.width + 200) {
      bottles.splice(i, 1);
      continue;
    }

    let img = bier;
    if (b.type === 'wasser') img = wasser;
    if (b.type === 'endgegner') img = boss;

    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.rotate(b.angle);
    ctx.drawImage(img, -b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }

  // Slice line
  slices = slices.filter(s => now - s.time < 400);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < slices.length; i++) {
    if (i === 0) ctx.moveTo(slices[i].x, slices[i].y);
    else ctx.lineTo(slices[i].x, slices[i].y);
  }
  ctx.stroke();

  // Treffer +1
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    ctx.globalAlpha = h.opacity;
    ctx.fillStyle = "#00ff00";
    ctx.font = "bold 28px Arial";
    ctx.fillText("+1", h.x, h.y);
    ctx.globalAlpha = 1.0;
    h.y -= 1;
    h.opacity -= 0.03;
    if (h.opacity <= 0) hits.splice(i, 1);
  }

  // Combos
  for (let i = combos.length - 1; i >= 0; i--) {
    const c = combos[i];
    ctx.globalAlpha = c.opacity;
    ctx.fillStyle = "#ffcc00";
    ctx.font = "bold 34px Arial";
    ctx.fillText("Combo x" + c.value, canvas.width / 2 - 80, 80);
    ctx.globalAlpha = 1.0;
    c.opacity -= 0.02;
    if (c.opacity <= 0) combos.splice(i, 1);
  }

  // Punkte & Leben
  ctx.font = "bold 26px sans-serif";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.strokeText("Punkte: " + score, 10, 40);
  ctx.strokeText("Leben: " + lives, 10, 70);
  ctx.fillStyle = "white";
  ctx.fillText("Punkte: " + score, 10, 40);
  ctx.fillText("Leben: " + lives, 10, 70);

  requestAnimationFrame(update);
}

spawnBottle();
update();
