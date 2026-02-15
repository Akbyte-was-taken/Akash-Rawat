// ---------- helpers ----------
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

function setTheme(next){
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("akbyte_theme", next);
  const icon = $("#themeToggle .icon");
  icon.textContent = next === "dark" ? "☾" : "☀";
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", next === "dark" ? "#0b0c10" : "#f7f7fb");
}

// ---------- theme ----------
const saved = localStorage.getItem("akbyte_theme");
if (saved === "light" || saved === "dark") setTheme(saved);
else {
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  setTheme(prefersLight ? "light" : "dark");
}

$("#themeToggle").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(cur === "dark" ? "light" : "dark");
});

// ---------- mobile nav ----------
const mobileNav = $("#mobileNav");
$("#hamburger").addEventListener("click", () => {
  mobileNav.classList.toggle("open");
});
$$(".mobile-nav a").forEach(a => a.addEventListener("click", () => mobileNav.classList.remove("open")));

// ---------- year ----------
$("#year").textContent = new Date().getFullYear();

// ---------- copy domain ----------
$("#copySite").addEventListener("click", async () => {
  const text = "akbyte.me";
  try{
    await navigator.clipboard.writeText(text);
    $("#copyState").textContent = "Copied";
    setTimeout(() => $("#copyState").textContent = "akbyte.me", 1000);
  }catch{
    $("#copyState").textContent = "Copy failed";
    setTimeout(() => $("#copyState").textContent = "akbyte.me", 1000);
  }
});

// ---------- fake send ----------
$("#fakeSend").addEventListener("click", () => {
  const btn = $("#fakeSend");
  const old = btn.textContent;
  btn.textContent = "Saved (demo)";
  btn.disabled = true;
  setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 1100);
});

// ---------- reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add("in");
  });
}, { threshold: 0.12 });

$$(".reveal").forEach(el => io.observe(el));

// ---------- easter egg trigger ----------
let keyBuf = "";
const secret = "akbyte";

function openGame(){
  Game.open();
}

document.addEventListener("keydown", (e) => {
  const k = (e.key || "").toLowerCase();
  if (!/^[a-z]$/.test(k)) return;
  keyBuf = (keyBuf + k).slice(-secret.length);
  if (keyBuf === secret) openGame();
});

// 7-click logo trigger
let logoClicks = 0;
let logoTimer = null;
$("#logoBtn").addEventListener("click", () => {
  logoClicks++;
  clearTimeout(logoTimer);
  logoTimer = setTimeout(() => (logoClicks = 0), 900);
  if (logoClicks >= 7) {
    logoClicks = 0;
    openGame();
  }
});

$("#openGame").addEventListener("click", openGame);

// ---------- mini game (Dodge the Blocks) ----------
const Game = (() => {
  const modal = $("#gameModal");
  const canvas = $("#game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const scoreEl = $("#score");
  const bestEl = $("#best");

  let raf = 0;
  let running = false;

  const state = {
    w: canvas.width,
    h: canvas.height,
    player: { x: 70, y: 180, r: 10, vx: 0, vy: 0, speed: 3.2 },
    blocks: [],
    t: 0,
    score: 0,
    best: Number(localStorage.getItem("akbyte_best") || "0"),
    dead: false,
    touch: { active: false, x: 0, y: 0 }
  };

  function reset(){
    state.player.x = 70;
    state.player.y = state.h / 2;
    state.player.vx = 0;
    state.player.vy = 0;
    state.blocks = [];
    state.t = 0;
    state.score = 0;
    state.dead = false;
    scoreEl.textContent = "0";
    bestEl.textContent = String(state.best);
  }

  function spawn(){
    // blocks from right
    const size = 16 + Math.random() * 22;
    const y = 20 + Math.random() * (state.h - 40);
    const speed = 2.2 + Math.min(2.2, state.score / 180);
    state.blocks.push({ x: state.w + size, y, s: size, v: speed });
  }

  function collideCircleRect(cx, cy, r, rx, ry, rw, rh){
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nx, dy = cy - ny;
    return (dx*dx + dy*dy) <= r*r;
  }

  function themeColors(){
    const theme = document.documentElement.getAttribute("data-theme");
    if (theme === "light"){
      return {
        bg: "#f7f7fb",
        panel: "rgba(0,0,0,0.06)",
        text: "rgba(0,0,0,0.88)",
        accent: "#6d28d9",
        danger: "#ef4444"
      };
    }
    return {
      bg: "#0b0c10",
      panel: "rgba(255,255,255,0.08)",
      text: "rgba(255,255,255,0.92)",
      accent: "#7c5cff",
      danger: "#fb7185"
    };
  }

  function draw(){
    const c = themeColors();

    // background
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, state.w, state.h);

    // subtle grid
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = c.panel;
    for (let x = 0; x < state.w; x += 28) ctx.fillRect(x, 0, 1, state.h);
    for (let y = 0; y < state.h; y += 28) ctx.fillRect(0, y, state.w, 1);
    ctx.globalAlpha = 1;

    // blocks
    for (const b of state.blocks){
      ctx.fillStyle = c.panel;
      ctx.fillRect(b.x, b.y - b.s/2, b.s, b.s);
      ctx.strokeStyle = c.accent;
      ctx.globalAlpha = 0.35;
      ctx.strokeRect(b.x, b.y - b.s/2, b.s, b.s);
      ctx.globalAlpha = 1;
    }

    // player
    ctx.beginPath();
    ctx.fillStyle = state.dead ? c.danger : c.accent;
    ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
    ctx.fill();

    // HUD text
    ctx.fillStyle = c.text;
    ctx.font = "13px ui-monospace, Menlo, Consolas, monospace";
    ctx.globalAlpha = 0.85;
    ctx.fillText("Tip: avoid squares. score grows over time.", 12, state.h - 14);
    ctx.globalAlpha = 1;

    // death overlay
    if (state.dead){
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = c.text;
      ctx.font = "bold 18px ui-sans-serif, system-ui";
      ctx.fillText("Game Over — press Restart", state.w/2 - 120, state.h/2 - 10);
      ctx.font = "13px ui-sans-serif, system-ui";
      ctx.fillText("Or press Enter", state.w/2 - 42, state.h/2 + 12);
      ctx.globalAlpha = 1;
    }
  }

  function step(){
    if (!running) return;

    state.t++;

    // movement input (touch drag aims player)
    if (state.touch.active){
      const dx = state.touch.x - state.player.x;
      const dy = state.touch.y - state.player.y;
      state.player.vx = Math.max(-state.player.speed, Math.min(state.player.speed, dx * 0.06));
      state.player.vy = Math.max(-state.player.speed, Math.min(state.player.speed, dy * 0.06));
    }

    state.player.x += state.player.vx;
    state.player.y += state.player.vy;

    // bounds
    state.player.x = Math.max(state.player.r, Math.min(state.w - state.player.r, state.player.x));
    state.player.y = Math.max(state.player.r, Math.min(state.h - state.player.r, state.player.y));

    // spawn
    const spawnRate = Math.max(28, 56 - Math.floor(state.score / 60));
    if (!state.dead && state.t % spawnRate === 0) spawn();

    // update blocks
    for (const b of state.blocks) b.x -= b.v;

    // remove off-screen
    state.blocks = state.blocks.filter(b => b.x + b.s > -20);

    // collision
    if (!state.dead){
      for (const b of state.blocks){
        if (collideCircleRect(state.player.x, state.player.y, state.player.r, b.x, b.y - b.s/2, b.s, b.s)){
          state.dead = true;
          break;
        }
      }
    }

    // score
    if (!state.dead){
      state.score += 1;
      scoreEl.textContent = String(state.score);
      if (state.score > state.best){
        state.best = state.score;
        localStorage.setItem("akbyte_best", String(state.best));
        bestEl.textContent = String(state.best);
      }
    }

    draw();
    raf = requestAnimationFrame(step);
  }

  // keyboard input
  const keys = { up:false, down:false, left:false, right:false };
  function applyKeys(){
    const p = state.player;
    let vx = 0, vy = 0;
    if (keys.left) vx -= p.speed;
    if (keys.right) vx += p.speed;
    if (keys.up) vy -= p.speed;
    if (keys.down) vy += p.speed;
    // normalize diagonals
    if (vx && vy){
      vx *= 0.72; vy *= 0.72;
    }
    p.vx = vx;
    p.vy = vy;
  }

  function onKeyDown(e){
    if (!modal.classList.contains("open")) return;
    const k = (e.key || "").toLowerCase();
    if (k === "arrowup" || k === "w") keys.up = true;
    if (k === "arrowdown" || k === "s") keys.down = true;
    if (k === "arrowleft" || k === "a") keys.left = true;
    if (k === "arrowright" || k === "d") keys.right = true;
    if (k === "enter" && state.dead) reset();
    applyKeys();
  }
  function onKeyUp(e){
    if (!modal.classList.contains("open")) return;
    const k = (e.key || "").toLowerCase();
    if (k === "arrowup" || k === "w") keys.up = false;
    if (k === "arrowdown" || k === "s") keys.down = false;
    if (k === "arrowleft" || k === "a") keys.left = false;
    if (k === "arrowright" || k === "d") keys.right = false;
    applyKeys();
  }

  // touch / pointer drag
  function pointerPos(ev){
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    state.touch.active = true;
    const p = pointerPos(e);
    state.touch.x = p.x; state.touch.y = p.y;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!state.touch.active) return;
    const p = pointerPos(e);
    state.touch.x = p.x; state.touch.y = p.y;
  });
  canvas.addEventListener("pointerup", () => {
    state.touch.active = false;
    state.player.vx = 0; state.player.vy = 0;
  });

  function open(){
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    bestEl.textContent = String(state.best);
    reset();
    running = true;
    cancelAnimationFrame(raf);
    draw();
    raf = requestAnimationFrame(step);
  }

  function close(){
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    running = false;
    cancelAnimationFrame(raf);
    state.touch.active = false;
  }

  $("#closeGame").addEventListener("click", close);
  $("#restartGame").addEventListener("click", reset);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return { open, close, reset };
})();

// close game with Esc
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("gameModal");
    if (modal.classList.contains("open")) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  }
});
