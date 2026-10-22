class Solution {
public:
    bool check(TreeNode* node ,TreeNode* lo, TreeNode* hi) {
        if (node==nullptr) return true;
        if (lo && node->val <= lo->val) return false;
        if (hi && node->val >= hi->val) return false;
        return check(node->left, lo, node) && check(node->right,node,hi);
    }

    bool isValidBST(TreeNode* root) {
        return check(root, nullptr,nullptr);
    }
};
