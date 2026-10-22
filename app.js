// app.js — wires the buttons to the BST logic and the renderer.

const CODE = {
  search: [
      "class Solution {",
      "public:",
      "    TreeNode* searchBST(TreeNode* root, int val) {",
      "        TreeNode* curr = root;",
      "        while (curr != nullptr && curr->val != val) {",
      "            if (val < curr->val) {",
      "                curr = curr->left;",
      "            } else {",
      "                curr = curr->right;",
      "            }",
      "        }",
      "        return curr;",
      "    }",
      "};"
  ],
  insert: [
      "class Solution {",
      "public:",
      "    TreeNode* insertIntoBST(TreeNode* root, int val) {",
      "        if (root == nullptr) return std::make_unique<TreeNode>(val).release();",
      "        if (val < root->val) {",
      "            root->left = insertIntoBST(root->left, val);",
      "        } else {",
      "            root->right = insertIntoBST(root->right, val);",
      "        }",
      "        return root;",
      "    }",
      "};"
  ],
  validate: [
      "class Solution {",
      "public:",
      "    bool check(TreeNode* node ,TreeNode* lo, TreeNode* hi) {",
      "        if (node==nullptr) return true;",
      "        if (lo && node->val <= lo->val) return false;",
      "        if (hi && node->val >= hi->val) return false;",
      "        return check(node->left, lo, node) && check(node->right,node,hi);",
      "    }",
      "",
      "    bool isValidBST(TreeNode* root) {",
      "        return check(root, nullptr,nullptr);",
      "    }",
      "};"
  ],
};

const TITLES = {
  search: "LC 700 · Search",
  insert: "LC 701 · Insert",
  validate: "LC 98 · Validate",
};

const $ = (id) => document.getElementById(id);

let root = buildFromList([8, 3, 10, 1, 6, 14, 4, 7, 13]);
let steps = [];
let idx = 0;
let algo = null;
let timer = null;

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function renderCode() {
  const box = $("code");
  box.replaceChildren();
  $("code-title").textContent = algo ? TITLES[algo] : "Code";

  if (!algo) {
    const span = document.createElement("span");
    span.className = "line muted";
    span.textContent = "// Pick Search, Insert or Validate to step through it.";
    box.appendChild(span);
    return;
  }

  const current = steps[idx] ? steps[idx].line : -1;
  CODE[algo].forEach((text, i) => {
    const span = document.createElement("span");
    span.className = i === current ? "line active" : "line";
    span.textContent = text;
    box.appendChild(span);
  });
}

function draw() {
  const s = steps[idx] || null;
  renderTree($("tree"), s ? s.tree : root, s);
  renderCode();

  const msg = $("msg");
  msg.textContent = s
    ? s.msg
    : root ? "Enter a value and pick an operation." : "The tree is empty. Insert a value or build a tree.";
  msg.className = "msg" + (s && s.result === true ? " good" : s && s.result === false ? " bad" : "");

  $("counter").textContent = steps.length ? `Step ${idx + 1} / ${steps.length}` : "";
  $("btn-first").disabled = !steps.length || idx === 0;
  $("btn-prev").disabled = !steps.length || idx === 0;
  $("btn-next").disabled = !steps.length || idx === steps.length - 1;
  $("btn-play").disabled = !steps.length;
  $("btn-play").textContent = timer ? "❚❚ Pause" : "▶ Play";
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

function stop() {
  clearInterval(timer);
  timer = null;
}

function go(i) {
  idx = Math.max(0, Math.min(i, steps.length - 1));
  if (idx === steps.length - 1) stop();
  draw();
}

function togglePlay() {
  if (timer) {
    stop();
    draw();
    return;
  }
  if (idx === steps.length - 1) idx = 0;
  timer = setInterval(() => go(idx + 1), Number($("speed").value));
  draw();
}

function start(kind, newSteps) {
  stop();
  algo = kind;
  steps = newSteps;
  idx = 0;
  draw();
}

function resetTree(newRoot) {
  stop();
  root = newRoot;
  steps = [];
  algo = null;
  idx = 0;
  draw();
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

function readValue() {
  const v = parseInt($("val").value, 10);
  if (Number.isNaN(v)) {
    $("msg").textContent = "Enter a whole number first.";
    $("msg").className = "msg bad";
    return null;
  }
  return v;
}

function parseList(text) {
  return text
    .split(/[\s,]+/)
    .map((x) => parseInt(x, 10))
    .filter((x) => !Number.isNaN(x));
}

function randomValues(count) {
  const set = new Set();
  while (set.size < count) set.add(1 + Math.floor(Math.random() * 99));
  return [...set];
}

$("btn-search").onclick = () => {
  const v = readValue();
  if (v !== null) start("search", searchSteps(root, v));
};

$("btn-insert").onclick = () => {
  const v = readValue();
  if (v === null) return;
  const result = insertSteps(root, v);
  root = result.root;
  start("insert", result.steps);
};

$("btn-validate").onclick = () => start("validate", validateSteps(root));

$("btn-build").onclick = () => resetTree(buildFromList(parseList($("list").value)));

$("btn-random").onclick = () => {
  const values = randomValues(8);
  $("list").value = values.join(", ");
  resetTree(buildFromList(values));
};

$("btn-trick").onclick = () => {
  $("list").value = "";
  resetTree(trickTree());
  $("msg").textContent = "Every parent/child pair looks fine here. Press Validate to see why it isn't a BST.";
};

$("btn-clear").onclick = () => {
  $("list").value = "";
  resetTree(null);
};

$("btn-first").onclick = () => { stop(); go(0); };
$("btn-prev").onclick = () => { stop(); go(idx - 1); };
$("btn-next").onclick = () => { stop(); go(idx + 1); };
$("btn-play").onclick = togglePlay;
$("speed").onchange = () => { if (timer) { stop(); togglePlay(); } };

$("val").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-search").click(); });
$("list").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-build").click(); });

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || !steps.length) return;
  if (e.key === "ArrowRight") { stop(); go(idx + 1); }
  if (e.key === "ArrowLeft") { stop(); go(idx - 1); }
  if (e.key === " ") { e.preventDefault(); togglePlay(); }
});

draw();
