# What I understood and How I understood it

I have learned that Binary Search uses a tactic where it searches the middle point of each subarray to look for its target value and returns index value.\
An animation by Y. Daniel Liang was very helpful in visualizing the basic concepts of binary search:\
https://yongdanielliang.github.io/animation/web/BinarySearchNew.html

**The difference between Binary Search and Binary Search Tree**\
They both use the same idea of comparing and throwing away half, except one is algorithm and one is data structure.\
Binary search is an **algorithm** that runs on a **sorted** array.\
BST is a **data structure** with nodes linked by pointers, arranged so that left child < parent < right child in terms of value.\
Learning linked lists helped me to solve BST LeetCodes quicker.

# BST Visualizer

**[▶ Live demo](https://behsty.github.io/bst-visualizer/)**

![BST Visualizer demo](bst.gif)

Try the **Trick tree** button: every parent/child pair looks valid, but the tree isn't a BST. Validate shows exactly why.

## How it works

Each algorithm records a list of snapshots ("steps") instead of animating directly. The page replays that list with Prev / Next / Play. This keeps the algorithm logic separate from the drawing code.

- `bst.js` – the algorithms, each returning a list of steps
- `render.js` – draws one step as an SVG
- `app.js` – buttons and playback
- `cpp/` – my C++ LeetCode solutions (the code panel shows these line for line)

## Problems

There is some inconsistency in the code where I would mention **Parent** then **Node**.\
Usually, *parent* and *root* would mean the same and *left, right, l, r, child* would mean the same.

## Run locally

Open `index.html` in a browser. No build step or install needed.
