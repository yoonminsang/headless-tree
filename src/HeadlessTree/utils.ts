import type { BasicTreeItem, TreeData, TreeItemId } from './types';

/**
 * @description Find the path to a specific node in the tree using iterative DFS
 * @returns The array of IDs from the root to the target node
 * @example
 * ```ts
 * const tree = {
 *   rootIds: ['1'],
 *   items: {
 *     '1': { id: '1', children: ['2'] },
 *     '2': { id: '2', children: ['3'] },
 *     '3': { id: '3', children: [] },
 *   },
 * };
 * ```
 * @returns ['1', '2', '3']
 */
export const getPath = <T extends BasicTreeItem>(tree: TreeData<T>, targetId: TreeItemId): TreeItemId[] => {
  // Stack to store [nodeId, pathToNode] pairs
  const stack: Array<[TreeItemId, TreeItemId[]]> = [];

  // Initialize stack with root nodes
  for (const rootId of tree.rootIds) {
    stack.push([rootId, [rootId]]);
  }

  // Track visited nodes to prevent infinite loops in case of circular references
  const visited = new Set<TreeItemId>();

  while (stack.length > 0) {
    const [currentId, currentPath] = stack.pop()!;

    // Skip if already visited (prevent circular reference issues)
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    // Found the target
    if (currentId === targetId) {
      return currentPath;
    }

    // Add children to stack with updated path
    const item = tree.items[currentId];
    if (item?.children) {
      // Add children in reverse order to maintain left-to-right traversal
      for (let i = item.children.length - 1; i >= 0; i--) {
        const childId = item.children[i];
        stack.push([childId, [...currentPath, childId]]);
      }
    }
  }

  // Node not found
  return [];
};

/**
 * @description Return all descendant IDs of a specific node
 * @returns The array of IDs of the descendants of the target node
 * @example
 * ```ts
 * const tree = {
 *   rootIds: ['1'],
 *   items: {
 *     '1': { id: '1', children: ['2'] },
 *     '2': { id: '2', children: ['3'] },
 *     '3': { id: '3', children: [] },
 *   },
 * };
 * ```
 * @returns ['2', '3']
 */
export const getAllDescendantIds = <T extends BasicTreeItem>(tree: TreeData<T>, id: TreeItemId): TreeItemId[] => {
  const descendants: TreeItemId[] = [];
  const queue = [...(tree.items[id]?.children || [])];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    descendants.push(currentId);

    const children = tree.items[currentId]?.children;
    if (children) {
      queue.push(...children);
    }
  }

  return descendants;
};
