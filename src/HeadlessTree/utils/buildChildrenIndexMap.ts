import type { BasicTreeItem, ChildrenIndexMap, TreeData } from '../types';

/**
 * @description Build a children index map from a tree for O(1) index lookups
 * @returns A map of parent IDs to a map of child IDs to their index positions
 */
export const buildChildrenIndexMap = <T extends BasicTreeItem>(tree: TreeData<T>): ChildrenIndexMap => {
  const indexMap = new Map();

  // Root items (parent is null)
  const rootIndexes = new Map();
  tree.rootIds.forEach((id, index) => rootIndexes.set(id, index));
  indexMap.set(null, rootIndexes);

  // Child items
  Object.values(tree.items).forEach((item) => {
    const childIndexes = new Map();
    item.children.forEach((childId, index) => childIndexes.set(childId, index));
    indexMap.set(item.id, childIndexes);
  });

  return indexMap;
};
