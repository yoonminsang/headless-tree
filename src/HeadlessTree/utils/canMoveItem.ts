import type { BasicTreeItem, TreeData, TreeItemId } from '../types';
import { getAllDescendantIds } from './getAllDescendantIds';

/**
 * @description Check if an item can be moved to a target position
 *
 * Validates that:
 * 1. Source and target are not the same item
 * 2. Target is not a descendant of source (prevents moving an item into its own subtree)
 *
 * @param tree The tree data structure
 * @param sourceId The item ID to be moved
 * @param targetId The target item ID (where the source will be moved)
 * @returns true if the move is valid, false otherwise
 *
 * @example
 * ```ts
 * const tree = {
 *   rootIds: ['1'],
 *   items: {
 *     '1': { id: '1', children: ['2', '3'] },
 *     '2': { id: '2', children: ['4'] },
 *     '3': { id: '3', children: [] },
 *     '4': { id: '4', children: [] },
 *   },
 * };
 *
 * canMoveItem(tree, '2', '3'); // true (can move 2 to 3)
 * canMoveItem(tree, '2', '4'); // false (4 is descendant of 2)
 * canMoveItem(tree, '2', '2'); // false (cannot move to itself)
 * ```
 */
export const canMoveItem = <T extends BasicTreeItem>(
  tree: TreeData<T>,
  sourceId: TreeItemId,
  targetId: TreeItemId
): boolean => {
  // Cannot move to itself
  if (sourceId === targetId) return false;

  // Cannot move to its own descendant
  const descendants = getAllDescendantIds(tree, sourceId);
  return !descendants.includes(targetId);
};
