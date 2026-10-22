// bst.js — BST logic only. No drawing code lives here.
//
// Each algorithm records a list of "steps" (snapshots) instead of animating
// directly. The UI replays the list with Prev / Next / Play.
//
// A step looks like:
// {
//   tree:   a copy of the tree at that moment,
//   active: id of the node being looked at (or null),
//   path:   ids of nodes visited so far (drawn as the highlighted route),
//   status: { id: "ok" | "bad" | "new" } colours for individual nodes,
//   bounds: { id: [lo, hi] } the allowed range shown under a node (validate),
//   parent: id of the node labelled "parent" (insert),
//   line:   which line of the C++ code to highlight,
//   msg:    the explanation shown under the tree,
//   result: true / false on the final validate step
// }

let nextId = 1;

class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.id = nextId++; // stable id so the renderer can track a node across steps
  }
}

function cloneTree(node) {
  if (node === null) return null;
  return {
    val: node.val,
    id: node.id,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function step(tree, fields) {
  return {
    tree,
    active: null,
    path: [],
    status: {},
    bounds: {},
    parent: null,
    line: -1,
    msg: "",
    result: null,
    ...fields,
  };
}

// ---------------------------------------------------------------------------
// Tree builders (no steps recorded)
// ---------------------------------------------------------------------------

function insertPlain(root, val) {
  if (root === null) return new TreeNode(val);
  let parent = null;
  let curr = root;
  while (curr !== null) {
    if (val === curr.val) return root; // ignore duplicates
    parent = curr;
    curr = val < curr.val ? curr.left : curr.right;
  }
  if (val < parent.val) parent.left = new TreeNode(val);
  else parent.right = new TreeNode(val);
  return root;
}

function buildFromList(values) {
  let root = null;
  for (const v of values) root = insertPlain(root, v);
  return root;
}

// The classic trap for LC 98: every parent/child pair looks fine,
// but 3 sits in 5's right subtree while being smaller than 5.
function trickTree() {
  const root = new TreeNode(5);
  root.left = new TreeNode(4);
  root.right = new TreeNode(6);
  root.right.left = new TreeNode(3);
  return root;
}

// ---------------------------------------------------------------------------
// LC 700 — Search in a BST (iterative)
// ---------------------------------------------------------------------------

function searchSteps(root, val) {
  const tree = cloneTree(root);
  const steps = [];
  const path = [];

  steps.push(step(tree, {
    line: 3,
    active: root ? root.id : null,
    msg: root ? `curr = root (${root.val}). Looking for ${val}.` : "The tree is empty, so curr = nullptr.",
  }));

  let curr = root;
  while (curr !== null) {
    path.push(curr.id);

    if (val === curr.val) {
      const found = { [curr.id]: "ok" };
      steps.push(step(tree, { line: 4, active: curr.id, path: [...path], status: found,
        msg: `curr->val == ${val}, so the while condition is false and the loop stops.` }));
      steps.push(step(tree, { line: 11, active: curr.id, path: [...path], status: found,
        msg: `Found it. Return the node with value ${curr.val}.` }));
      return steps;
    }

    if (val < curr.val) {
      steps.push(step(tree, { line: 6, active: curr.id, path: [...path],
        msg: `${val} < ${curr.val}, so curr = curr->left.` }));
      curr = curr.left;
    } else {
      steps.push(step(tree, { line: 8, active: curr.id, path: [...path],
        msg: `${val} > ${curr.val}, so curr = curr->right.` }));
      curr = curr.right;
    }
  }

  steps.push(step(tree, { line: 11, path: [...path],
    msg: `curr is nullptr: ${val} is not in the tree. Return nullptr.` }));
  return steps;
}

// ---------------------------------------------------------------------------
// LC 701 — Insert into a BST (recursive)
// Mirrors: root->left = insertIntoBST(root->left, val);
// Returns { steps, root } because inserting changes the tree.
// ---------------------------------------------------------------------------

function insertSteps(root, val) {
  const steps = [];
  const before = cloneTree(root);
  const path = [];
  let after = null;    // tree snapshot once the new node exists
  let newId = null;

  const snap = (fields) => {
    const tree = newId === null ? before : after;
    const status = newId === null ? {} : { [newId]: "new" };
    steps.push(step(tree, { path: [...path], status, ...fields }));
  };

  function insert(node, depth) {
    const call = `call #${depth}`;

    if (node === null) {
      const created = new TreeNode(val);
      newId = created.id;
      path.push(created.id);
      // Snapshot the full tree with the new node attached, so it is visible
      // while the recursion unwinds and reattaches each subtree.
      return created;
    }

    path.push(node.id);
    const goLeft = val < node.val;
    snap({
      line: goLeft ? 5 : 7,
      active: node.id,
      msg: `${call}: ${val} ${goLeft ? "<" : ">="} ${node.val}, so call insertIntoBST(root->${goLeft ? "left" : "right"}, ${val}).`,
    });

    const child = goLeft ? node.left : node.right;
    const returned = insert(child, depth + 1);

    if (child === null) {
      // This is the frame whose child pointer actually changes.
      if (goLeft) node.left = returned; else node.right = returned;
      after = cloneTree(root);
      snap({
        line: 3,
        active: returned.id,
        msg: `call #${depth + 1}: root == nullptr, so create a new node with ${val} and return it.`,
      });
      snap({
        line: goLeft ? 5 : 7,
        active: node.id,
        msg: `${call}: root->${goLeft ? "left" : "right"} = the new node. ${val} is now attached under ${node.val}.`,
      });
    } else {
      if (goLeft) node.left = returned; else node.right = returned;
      snap({
        line: goLeft ? 5 : 7,
        active: node.id,
        msg: `${call}: root->${goLeft ? "left" : "right"} = the same subtree that came back (${returned.val}), so nothing changes here.`,
      });
    }

    snap({ line: 9, active: node.id, msg: `${call}: return root (${node.val}) to the caller.` });
    return node;
  }

  if (root === null) {
    steps.push(step(null, { line: 3, msg: "call #1: root == nullptr, the tree is empty." }));
    const node = new TreeNode(val);
    steps.push(step(cloneTree(node), { line: 3, active: node.id, path: [node.id], status: { [node.id]: "new" },
      msg: `Create a new node with ${val} and return it. It becomes the root.` }));
    return { steps, root: node };
  }

  insert(root, 1);
  snap({ line: -1, msg: `Done. The outermost call returned the original root (${root.val}).` });
  return { steps, root };
}

// ---------------------------------------------------------------------------
// LC 98 — Validate a BST (recursive, passing lo / hi bounds down)
// ---------------------------------------------------------------------------

function validateSteps(root) {
  const tree = cloneTree(root);
  const steps = [];
  const status = {};
  const bounds = {};

  // Copy status/bounds so each step keeps its own snapshot.
  const snap = (fields) =>
    steps.push(step(tree, { status: { ...status }, bounds: { ...bounds }, ...fields }));

  function check(node, lo, hi) {
    if (node === null) return true;

    bounds[node.id] = [lo ? lo.val : null, hi ? hi.val : null];
    const range = `(${lo ? lo.val : "−∞"}, ${hi ? hi.val : "∞"})`;
    snap({ line: 2, active: node.id, msg: `check(${node.val}): it must be strictly inside ${range}.` });

    if (lo && node.val <= lo.val) {
      status[node.id] = "bad";
      snap({ line: 4, active: node.id, msg: `${node.val} <= lo (${lo.val}). Return false.` });
      return false;
    }

    if (hi && node.val >= hi.val) {
      status[node.id] = "bad";
      snap({ line: 5, active: node.id, msg: `${node.val} >= hi (${hi.val}). Return false.` });
      return false;
    }

    status[node.id] = "ok";
    snap({ line: 6, active: node.id,
      msg: `${node.val} is in range. Check its left subtree, with ${node.val} as the new hi.` });

    if (!check(node.left, lo, node)) {
      snap({ line: 6, active: node.id,
        msg: `The left subtree of ${node.val} failed. && short-circuits, so the right side is never checked.` });
      return false;
    }

    snap({ line: 6, active: node.id,
      msg: `The left subtree of ${node.val} passed. Check its right subtree, with ${node.val} as the new lo.` });
    return check(node.right, node, hi);
  }

  if (root === null) {
    snap({ line: 10, msg: "Empty tree: return true. An empty tree is a valid BST.", result: true });
    return steps;
  }

  snap({ line: 10, msg: "isValidBST calls check(root, nullptr, nullptr). The root has no bounds yet." });
  const ok = check(root, null, null);
  snap({
    line: 10,
    result: ok,
    msg: ok
      ? "Every path reached nullptr without breaking a bound. Valid BST ✓"
      : "A node broke its bounds. NOT a valid BST ✗",
  });
  return steps;
}

// Lets Node.js load this file for testing; ignored in the browser.
if (typeof module !== "undefined") {
  module.exports = { TreeNode, buildFromList, trickTree, searchSteps, insertSteps, validateSteps };
}
