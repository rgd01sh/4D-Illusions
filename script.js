let maxPoints = 1500;
let addSpeed = 2; // Adjusted addSpeed for slower movement

class Vec4 {
  constructor(x, y, z, w, r = 100) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    this.r = r;
    this.count = 10;
  }
  op(p, f) {
    this.x = f(this.x, p.x != undefined ? p.x : p);
    this.y = f(this.y, p.y != undefined ? p.y : p);
    this.z = f(this.z, p.z != undefined ? p.z : p);
    this.w = f(this.w, p.w != undefined ? p.w : p);
    return this;
  }
  plus(p) { return this.op(p, (a, b) => a + b) }
  minus(p) { return this.op(p, (a, b) => a - b) }
  times(p) { return this.op(p, (a, b) => a * b) }
  div(p) { return this.op(p, (a, b) => a / b) }
  distTo(p) { return Math.hypot(this.x - p.x, this.y - p.y, this.z - p.z, this.w - p.w) }
  clone() { return new Vec4(this.x, this.y, this.z, this.w, this.r) }
  updateRotation() {
    let { x, y, z } = this.clone().minus(origin);
    this.screenCoord = [
      (x * cx - y * sx),
      (y * cx + x * sx) * cy + sy * z
    ];
    this.depth = z * cy - sy * (y * cx + x * sx);
  }
  render() {
    this.count++;

    let amt = this.count / maxPoints;
    amt = 1 - (cos(amt * addSpeed * TAU) + 1) / 2;
    amt = pow(amt, .8  );

    noFill();
    stroke(this.hue, .3, 1, .09);
    strokeWeight(0.2); // Further reduced stroke weight for clearer lines

    let size = noise((this.x + frameCount) / 40, this.y / 10, this.z / 20, this.w / 30) * 50 + 10;
    let halfSize = size * 1;
    let [sx, sy] = this.screenCoord;

    // Drawing the shape
    if (this.count > 1) {
      let prev = points[this.count - 2];
      let [prevX, prevY] = prev.screenCoord;
      line(prevX, prevY, sx, sy);
    }
  }
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 1, 1, 4);
  rectMode(CENTER);
  windowResized();
}

let points = [];
let r = (n) => random(-n, n);
let v4 = (x, y, z, w) => new Vec4(x, y, z, w);
let l3 = (p1, p2, c) => new Line(p1, p2, c);
let rPoint = (n) => v4(r(n), r(n), r(n), r(n));

let step = 0;
let d = 10;
let t = 0;
let p = 0;
let nextPoint = () => {
  step++;

  // Generate points forming multiple triangles within a defined volume
  let x, y, z, w;
  x = random(-d, d);
  y = random(-d, d);
  z = random(-d, d);
  w = random(-d, d);

  // Adjusting the bounds for the enclosing hypercube
  x = constrain(x, -800, 800);
  y = constrain(y, -800, 800);
  z = constrain(z, -800, 800);
  w = constrain(w, -800, 800);

  let v = v4(x, y, z, w);
  v.hue = ((step / 3) / maxPoints) % 1;
  return v;
}

let init = () => {
  points = [];
  step = 0;
  d = 800;
  t = 0;
  p = 0;

  noiseSeed(random() * 1e8);

  for (let i = 0; i < maxPoints; i++) {
    points.push(nextPoint());
  }
}

let rotY = -Math.PI / 8;
let rotX = 4;
let zoom = 2;
let cx, sx, cy, sy;

let near = 800;

let mX = 0;
let mY = 0;

let origin = new Vec4(0, 0, 0, 0);

function draw() {
  background(0, .1);
  stroke(0);

  push();
  updateCamera();
  translate(width / 2, height / 3, -500); // Center the canvas and move it back
  scale(zoom);
  let [x, y] = origin.screenCoord;
  translate(x, y, 0); // Move to the origin

  let n = near / (zoom * zoom);

  blendMode(ADD);
  for (let i = 0; i < addSpeed; i++) {
    points.shift();
    points.push(nextPoint());
  }
  points.map(p => p.updateRotation());
  points.map(p => p.render());
  
  // Draw cube around the points
  strokeWeight(1); // Adjust the stroke weight
  stroke(0, 0, 1, 0.5); // Adjust the stroke color
  beginShape();
  for (let i =1; i < 100; i++) {
    let v = rPoint(d /7);
    vertex(v.x, v.y, v.z, v.w);
  }
  endShape(CLOSE);
  
  pop();
}


let updateCamera = () => {
  rotX += mX;
  rotY += mY;
  rotY = constrain(rotY, -PI, 0);
  mX *= .2;
  mY *= .3;

  [cx, sx, cy, sy] = [cos(rotX), sin(rotX), cos(rotY), sin(rotY)];

  rotX += .010;

  origin.updateRotation();
}

let pointerIsDown = false;
let prevX = 0;
let prevY = 0;
window.addEventListener("pointerdown", evt => {
  pointerIsDown = true;
  prevX = evt.clientX;
  prevY = evt.clientY;
  console.log("pointerdown");
});

window.addEventListener("pointerup", evt => {
  pointerIsDown = false;
  console.log("pointerup");
})

window.addEventListener("pointermove", evt => {

  if (pointerIsDown) {
    let [x, y] = [evt.clientX, evt.clientY];
    if (prevX && prevY && x && y) {
      let moveX = x - prevX;
      let moveY = y - prevY;
      mX = -moveX / 900;
      mY = moveY / 600;
      prevX = x;
      prevY = y;
    }
  }
});

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  zoom = min(width, height) * 3/ 9062;
  init();
}
