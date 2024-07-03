const renderConf = {
  TILESPACING: 40,
  TILESIZE: 0,
  GWIDTH: 0,
  GHEIGHT: 0,
  canvas: null,
};

const renderColors = {
  lineCircle: "#000",
  lineEllipse: "#999999",
  bgTile: "#fff",
  cDot: "#d00000",
  eDot: "#0000d0",
};

const drawTile = (
  x,
  y,
  fillColor = renderColors.bgTile,
  s = renderConf.TILESIZE
) => {
  beginShape();
  fill(color(fillColor));
  vertex(x - s / 2, y - s / 2);
  vertex(x + s / 2, y - s / 2);
  vertex(x + s / 2, y + s / 2);
  vertex(x - s / 2, y + s / 2);
  endShape(CLOSE);
};

// returns [[x,y]] coords of an octet of a circle of given radius
const bresenhamOctet = (radius) => {
  let d = 1 - radius;
  let x = 0;
  let y = radius;

  const octet = [[x, y]];

  while (x < y) {
    x++;
    if (d < 0) {
      d += 2 * x + 1;
    } else {
      y--;
      d += 2 * (x - y) + 1;
    }
    if (x <= y) octet.push([x, y]);
  }
  return octet;
};

/** returns a text representation of an octet, pass in just the y's of
 * an octet and it returns the number of tiles to place in each y level
 * of the octet. Eg an octet with radius = 6 returns [3,1,1]:
 *
 *  xxx
 *     x
 *      x
 * this includes the tiles at [0, radius] and at [x = y] (if any)
 *
 * octetYs: just the y coordinates returned from bresenhamOctet()
 */
const generateCirclePlan = (octetYs) => {
  const res = [];
  let count = 1;
  for (let i = 1; i <= octetYs.length; i++) {
    if (octetYs[i] == octetYs[i - 1]) {
      count++;
    } else {
      res.push(count);
      count = 1;
    }
  }
  return res;
};

// returns [[x,y]] coords for a circle of given radius, centered at 0,0
const generateCircle = (radius) => {
  const octet = bresenhamOctet(radius);
  return [
    ...octet,
    ...octet.map((it) => [it[1], it[0]]),
    ...octet.map((it) => [it[1], -it[0]]),
    ...octet.map((it) => [it[0], -it[1]]),
    ...octet.map((it) => [-it[0], -it[1]]),
    ...octet.map((it) => [-it[1], -it[0]]),
    ...octet.map((it) => [-it[1], it[0]]),
    ...octet.map((it) => [-it[0], it[1]]),
  ];
};

/** generates a quadrant of a bresenham ellipse bound by the rectangle
 * described by startx, starty, endx, endy
 *
 * startx, starty: x,y of the bottom left vertex of the rect
 * endx, endy: x, y of the top right vertex of the rect
 *
 * ensure that startx <  endx, starty < endy
 *
 * returns [[x,y]] coords for the ellipse
 */
const bresenhamEllipse = (startx, starty, endx, endy) => {
  let a = Math.abs(endx - startx);
  const b = Math.abs(endy - starty);
  let b1 = b & 1;

  let dx = 4 * (1 - a) * Math.pow(b, 2);
  let dy = 4 * (b1 + 1) * Math.pow(a, 2);
  let err = dx + dy + b1 * Math.pow(a, 2);

  starty += Math.floor((b + 1) / 2);
  endy = starty - b1;
  a *= 8 * a;
  b1 = 8 * Math.pow(b, 2);

  const ellipse = [];
  do {
    ellipse.push(
      [endx, starty],
      [startx, starty],
      [startx, endy],
      [endx, endy]
    );
    const e2 = 2 * err;
    if (e2 <= dy) {
      starty++;
      endy--;
      err += dy += a;
    }
    if (e2 >= dx || 2 * err > dy) {
      startx++;
      endx--;
      err += dx += b1;
    }
  } while (startx <= endx);

  while (starty - endy < b) {
    ellipse.push([startx - 1, starty]);
    ellipse.push([endx + 1, starty++]);
    ellipse.push([startx - 1, endy]);
    ellipse.push([endx + 1, endy--]);
  }
  return ellipse;
};

/** draw the grid of tiles */
function drawGrid() {
  background(0);
  noStroke();
  fill(color(renderColors.bgTile));

  const { TILESPACING, GWIDTH, GHEIGHT } = renderConf;

  for (let x = 0; x < GWIDTH; x++) {
    for (let y = 0; y < GHEIGHT; y++) {
      const tilex = x * TILESPACING + TILESPACING / 2;
      const tiley = y * TILESPACING + TILESPACING / 2;
      drawTile(tilex, tiley);
    }
  }
}

/** paints a circle */
function drawCircle(radius) {
  const { TILESPACING, GWIDTH, GHEIGHT } = renderConf;
  const centerx = Math.floor(GWIDTH / 2) * TILESPACING;
  const centery = Math.floor(GHEIGHT / 2) * TILESPACING;

  const circle = generateCircle(radius);
  circle.forEach((point) => {
    const tilex = point[0] * TILESPACING + TILESPACING / 2;
    const tiley = point[1] * TILESPACING + TILESPACING / 2;
    drawTile(tilex + centerx, tiley + centery, renderColors.lineCircle);
  });
  drawTile(
    centerx + TILESPACING / 2,
    centery + TILESPACING / 2,
    renderColors.cDot
  );
}

/** paints an ellipse */
function drawEllipse(height, width) {
  const { TILESPACING, GWIDTH, GHEIGHT } = renderConf;
  const centerx = Math.floor(GWIDTH / 2 - width / 2) * TILESPACING;
  const centery = Math.floor(GHEIGHT / 2 - height / 2) * TILESPACING;

  const ellipse = bresenhamEllipse(0, 0, width, height);
  ellipse.forEach((point) => {
    const tilex = point[0] * TILESPACING + TILESPACING / 2;
    const tiley = point[1] * TILESPACING + TILESPACING / 2;
    drawTile(tilex + centerx, tiley + centery, renderColors.lineEllipse);
  });
  drawTile(
    centerx + TILESPACING / 2,
    centery + TILESPACING / 2,
    renderColors.eDot
  );
}

/** paints the circle and ellipse outlines
 * circle: boolean, toggle the circle
 * ellipse: boolean, toggle the ellipse
 * dimensions: {radius: ?, height: ?, width: ?}
 */
function drawDome(circle, ellipse, dimensions) {
  drawGrid();
  if (circle) drawCircle(dimensions.radius);
  if (ellipse) drawEllipse(dimensions.height, dimensions.width);
}

/** set tile zoom level */
function changeZoom(zoom) {
  renderConf.TILESPACING = zoom;
  setDimensions();
}

/** initialize dimensions using canvas size */
function setDimensions() {
  renderConf.GWIDTH = round(width / renderConf.TILESPACING);
  renderConf.GHEIGHT = round(height / renderConf.TILESPACING);
  renderConf.TILESIZE = renderConf.TILESPACING - 1;
}

function setGrid(show) {
  renderConf.TILESIZE = renderConf.TILESPACING - (show ? 1 : 0);
}

function getCanvasDimensions() {
  const w = windowWidth;
  const h = document.getElementById("canvas-container").offsetHeight;
  return { w, h };
}

function setup() {
  const dims = getCanvasDimensions();
  renderConf.canvas = createCanvas(dims.w, dims.h);
  setDimensions();
}

function scaleCanvas(takenWidth) {
  const dims = getCanvasDimensions();
  resizeCanvas(dims.w - takenWidth, dims.h);
}
