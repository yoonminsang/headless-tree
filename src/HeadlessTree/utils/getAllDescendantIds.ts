import type { BasicTreeItem, TreeData, TreeItemId } from '../types';

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
export const getAllDescendantIds = <CustomData extends BasicTreeItem>(
  tree: TreeData<CustomData>,
  id: TreeItemId
): TreeItemId[] => {
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
