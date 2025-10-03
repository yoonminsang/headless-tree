import type { BasicTreeItem, ParentMap, TreeData } from '../types';

/**
 * @description Build a parent map from a tree
 * @returns A map of parent IDs to child IDs
 */
export const buildParentMap = <T extends BasicTreeItem>(tree: TreeData<T>): ParentMap => {
  const parentMap = new Map();

  // Root items
  tree.rootIds.forEach((id) => parentMap.set(id, null));

  // Child items
  Object.values(tree.items).forEach((item) => {
    item.children.forEach((childId) => parentMap.set(childId, item.id));
  });

  return parentMap;
};
