// render.js — draws one step of the tree as SVG. No BST logic lives here.

const SVG_NS = "http://www.w3.org/2000/svg";
const R = 20;      // node radius
const GAP_X = 62;  // horizontal space between nodes
const GAP_Y = 80;  // vertical space between levels
const PAD = 40;    // padding around the drawing

function svgEl(tag, attrs, parent) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

// Layout trick: x = position in an in-order traversal, y = depth.
// In-order visits nodes left to right, so nothing ever overlaps.
function layout(root) {
  const pos = {};
  let i = 0;
  let maxDepth = 0;

  (function walk(n, depth) {
    if (n === null) return;
    walk(n.left, depth + 1);
    pos[n.id] = { x: PAD + R + i * GAP_X, y: PAD + R + depth * GAP_Y };
    i++;
    maxDepth = Math.max(maxDepth, depth);
    walk(n.right, depth + 1);
  })(root, 0);

  return {
    pos,
    width: PAD * 2 + R * 2 + Math.max(i - 1, 0) * GAP_X,
    height: PAD * 2 + R * 2 + maxDepth * GAP_Y + 20, // + room for bound labels
  };
}

function renderTree(svg, tree, step) {
  svg.replaceChildren();

  if (tree === null) {
    svg.setAttribute("viewBox", "0 0 320 120");
    svg.setAttribute("width", 320);
    svg.setAttribute("height", 120);
    const t = svgEl("text", { x: 160, y: 60, class: "empty", "text-anchor": "middle", "dominant-baseline": "central" }, svg);
    t.textContent = "Empty tree";
    return;
  }

  const { pos, width, height } = layout(tree);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  const s = step || {};
  const onPath = new Set(s.path || []);
  const edgeLayer = svgEl("g", {}, svg);
  const nodeLayer = svgEl("g", {}, svg);

  // Edges first so nodes sit on top of them.
  (function drawEdges(n) {
    if (n === null) return;
    for (const child of [n.left, n.right]) {
      if (child === null) continue;
      const hot = onPath.has(n.id) && onPath.has(child.id);
      svgEl("line", {
        x1: pos[n.id].x, y1: pos[n.id].y,
        x2: pos[child.id].x, y2: pos[child.id].y,
        class: hot ? "edge hot" : "edge",
      }, edgeLayer);
      drawEdges(child);
    }
  })(tree);

  (function drawNodes(n) {
    if (n === null) return;
    const p = pos[n.id];

    const classes = ["node"];
    if (onPath.has(n.id)) classes.push("path");
    if (s.status && s.status[n.id]) classes.push(s.status[n.id]);
    if (s.active === n.id) classes.push("active");

    const g = svgEl("g", { class: classes.join(" "), transform: `translate(${p.x}, ${p.y})` }, nodeLayer);
    svgEl("circle", { r: R }, g);

    const label = svgEl("text", { class: "val", "text-anchor": "middle", "dominant-baseline": "central" }, g);
    label.textContent = n.val;

    const b = s.bounds && s.bounds[n.id];
    if (b) {
      const bt = svgEl("text", { class: "bounds", y: R + 15, "text-anchor": "middle" }, g);
      bt.textContent = `(${b[0] ?? "−∞"}, ${b[1] ?? "∞"})`;
    }

    if (s.parent === n.id) {
      const tag = svgEl("text", { class: "tag", y: -R - 8, "text-anchor": "middle" }, g);
      tag.textContent = "parent";
    }

    drawNodes(n.left);
    drawNodes(n.right);
  })(tree);
}
