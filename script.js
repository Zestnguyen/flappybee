const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");

// === Hình ảnh (thay link tuỳ ý) ===
let birdImg = new Image();
birdImg.src = "https://i.postimg.cc/FsMYQ7vY/Chat-GPT-Image-15-00-05-4-thg-11-2025.png";
let bgImg = new Image();
bgImg.src = "https://i.postimg.cc/qvWNcwQZ/pexels-zozz-544554.jpg";
let pipeImg = new Image();
pipeImg.src = "https://i.postimg.cc/X7Grh9RW/9aa85c8e-eb53-45e1-9b48-23af89a1d55d-1.jpg";

// === Các biến động dựa trên canvas (sẽ set trong resizeCanvas) ===
let bird = { x: 50, y: 150, width: 40, height: 30, gravity: 0.25, lift: -5, velocity: 0 };
let pipes = [];
let frame = 0, score = 0, gameOver = false, playing = false;
let gap = 120, pipeSpeed = 2, pipeWidth = 60, spawnRate = 90;

// === Menu ===
document.getElementById("startBtn").onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  startGame();
};
document.getElementById("createBtn").onclick = () => {
  alert("Thay link ảnh trong file script.js: birdImg.src / bgImg.src / pipeImg.src");
};
document.getElementById("settingBtn").onclick = () => {
  const settings = document.getElementById("settings");
  settings.style.display = settings.style.display === "none" ? "block" : "none";
};
document.getElementById("difficulty").oninput = e => {
  const val = +e.target.value;
  document.getElementById("diffText").textContent = ["Dễ","Trung bình","Khó"][val-1];
  // difficulty influences gap and speed
  pipeSpeed = 2 + (val - 1) * 1.2;
  // gap recalculated on resize but we nudge spawnRate:
  spawnRate = Math.max(60, Math.floor(100 - (val-1)*15));
};

// === Start / Loop ===
function startGame() {
  // reset
  pipes = [];
  score = 0;
  frame = 0;
  gameOver = false;
  playing = true;
  // reset position relative to canvas size
  bird.y = canvas.height * 0.35;
  bird.velocity = 0;
  requestAnimationFrame(loop);
}

function loop() {
  if (!playing) return;

  // draw background stretched
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // physics
   bird.velocity += bird.gravity;
  bird.y += bird.velocity;  
  // ground / ceiling collisions
  if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
    endGame();
  }

  // spawn pipes every spawnRate frames
  if (frame % spawnRate === 0) {
    // top position: at least 10% from top and bottom
    const top = Math.random() * (canvas.height - gap - canvas.height*0.15) + canvas.height*0.05;
    pipes.push({ x: canvas.width, top: top, bottom: top + gap, passed: false });
  }

  // update and draw pipes
  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= pipeSpeed;

    // Draw top pipe: flip the image vertically but scale it to the desired pipeHeight
    const topHeight = p.top;
    // calculate draw height keeping pipeImg aspect ratio to fill the vertical piece
    // We draw the pipe image scaled to pipeWidth; for height we just fill enough to cover topHeight/bottomHeight.
    // Draw top (flipped)
    ctx.save();
    ctx.translate(p.x + pipeWidth / 2, 0);
    ctx.scale(1, -1);
    // draw image with width pipeWidth and height = topHeight + pipeImg.height (to avoid gaps if image short)
    ctx.drawImage(pipeImg, -pipeWidth/2, -(topHeight), pipeWidth, topHeight);
    ctx.restore();

    // Draw bottom
    const bottomHeight = canvas.height - p.bottom;
    ctx.drawImage(pipeImg, p.x, p.bottom, pipeWidth, bottomHeight);

    // collision detection (AABB)
    if (
      bird.x + bird.width > p.x &&
      bird.x < p.x + pipeWidth &&
      (bird.y < p.top || bird.y + bird.height > p.bottom)
    ) {
      endGame();
    }

    // scoring: when pipe passes bird (once)
    if (!p.passed && p.x + pipeWidth < bird.x) {
      p.passed = true;
      score++;
    }

    // remove off-screen pipes
    if (p.x + pipeWidth < -50) pipes.splice(i, 1);
  }

  // draw bird
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // score
  ctx.fillStyle = "#000";
  ctx.font = `${Math.max(16, Math.round(canvas.width * 0.05))}px Poppins`;
  ctx.fillText("Điểm: " + score, 10, Math.max(24, Math.round(canvas.height * 0.05)));

  frame++;
  if (!gameOver) requestAnimationFrame(loop);
}

function endGame() {
  gameOver = true;
  playing = false;

  // overlay
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = `${Math.max(22, Math.round(canvas.width * 0.07))}px Poppins`;
  ctx.fillText("Game Over!", canvas.width * 0.3, canvas.height * 0.4);
  ctx.font = `${Math.max(18, Math.round(canvas.width * 0.05))}px Poppins`;
  ctx.fillText("Điểm: " + score, canvas.width * 0.3, canvas.height * 0.5);

  // show menu back immediately so user can restart (you can change to delay)
  setTimeout(() => {
    menu.style.display = "flex";
    canvas.style.display = "none";
    ctx.textAlign = "start";
  }, 800);
}

// controls
document.addEventListener("keydown", e => {
  if (e.code === "Space") birdJump();
});
canvas.addEventListener("click", () => birdJump());

function birdJump() {
  // stronger lift scaled to canvas
  bird.velocity = bird.lift;
}

// === Responsive sizing ===
function resizeCanvas() {
  // compute canvas display size (kept from previous logic)
  const ratio = 360 / 480;
  let w = window.innerWidth * 0.9;
  let h = w / ratio;
  if (h > window.innerHeight * 0.8) {
    h = window.innerHeight * 0.8;
    w = h * ratio;
  }
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);

  // scale bird & pipes relative to canvas
  bird.width = Math.round(canvas.width * 0.1);      // bird = 10% canvas width
  bird.height = Math.round(bird.width * 0.85);      // keep bird aspect approx
  bird.x = Math.round(canvas.width * 0.12);         // bird horizontal pos
// Cấu hình con ong (hoặc chim)
bird.x = canvas.width / 5;
bird.y = canvas.height / 2;
bird.radius = canvas.width * 0.04;

// Kiểm tra thiết bị
const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

// ⚙️ Cấu hình riêng theo thiết bị
if (isMobile) {
  // 🚀 Tốc độ nhanh hơn PC nhưng vẫn mượt
  bird.gravity = 1* (360 / canvas.width);   // rơi nhanh hơn
  bird.lift = -Math.max(4.5, canvas.height * 0.018); // nhảy mạnh hơn
  pipeGap = canvas.height * 0.24;               // khe ống hợp lý
  pipeSpacing = canvas.width * 0.55;
} else {
  // 💻 PC — cấu hình chuẩn
  bird.gravity = 0.4 * (360 / canvas.width);
  bird.lift = -Math.max(3.2, canvas.height * 0.015);
  pipeGap = canvas.height * 0.22;
  pipeSpacing = canvas.width * 0.55;
}


  // spawnRate scaled to width (bigger screen => a bit more spacing)
  spawnRate = 200;

  // ensure existing pipes adjust (optional)
  for (let p of pipes) {
    // nothing to change; new spawns will follow new sizes
  }
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();














