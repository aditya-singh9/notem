const canvas = document.querySelector("#canvas");

const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
ctx.scale(dpr, dpr);

// Setup
let width;
let height;

function setDimentions() {
  canvas.width = width = canvas.getBoundingClientRect().width * dpr;
  canvas.height = height = canvas.getBoundingClientRect().height * dpr;
  canvas.style.width = `calc(100% - 20px)`;
  canvas.style.height = `calc(100% - 20px)`;

  drawGrid();
}

function drawGrid() {
  ctx.fillStyle = "transparent";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fcc42a29";

  for (let x = width / 100 / 2; x <= width; x += Math.ceil(width / 100)) {
    for (let y = height / 100 / 2; y <= height; y += Math.ceil(height / 100)) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.closePath();
    }
  }
}

setDimentions();

window.addEventListener("resize", setDimentions);
