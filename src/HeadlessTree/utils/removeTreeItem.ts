import { logError } from '../../internal/logError';
import type { BasicTreeItem, ParentMap, TreeData, TreeItemId } from '../types';
import { getAllDescendantIds } from './getAllDescendantIds';

const getNewItems = <T extends BasicTreeItem>(tree: TreeData<T>, itemId: TreeItemId): Record<TreeItemId, T> => {
  // Collect all descendants to remove
  const descendantIds = getAllDescendantIds(tree, itemId);
  const allIdsToRemove = [itemId, ...descendantIds];

  // Create new items object without removed items
  const newItems = { ...tree.items };
  allIdsToRemove.forEach((id) => {
    delete newItems[id];
  });
  return newItems;
};

const removeFromRoot = (itemId: TreeItemId, rootIds: TreeItemId[]): TreeItemId[] | null => {
  const newRootIds = [...rootIds];
  const rootIndex = newRootIds.indexOf(itemId);
  if (rootIndex === -1) {
    logError(new Error(`[removeTreeItem] Item with id "${itemId}" not found in root`));
    return null;
  }
  newRootIds.splice(rootIndex, 1);
  return newRootIds;
};

const removeFromParent = <T extends BasicTreeItem>(
  itemId: TreeItemId,
  parentId: TreeItemId,
  newItems: Record<TreeItemId, T>
): boolean => {
  const parent = newItems[parentId];
  if (!parent) {
    logError(new Error(`[removeTreeItem] Parent with id "${parentId}" not found in tree`));
    return false;
  }
  newItems[parentId] = {
    ...parent,
    children: parent.children.filter((id) => id !== itemId),
  };
  return true;
};

const getNewRootIds = <T extends BasicTreeItem>(
  itemId: TreeItemId,
  parentMap: ParentMap,
  tree: TreeData<T>,
  newItems: Record<TreeItemId, T>
): TreeItemId[] | null => {
  const foundParentId = parentMap.get(itemId);

  // Not in parentMap
  if (foundParentId === undefined) {
    logError(new Error(`[removeTreeItem] Item with id "${itemId}" not found in parentMap`));
    return null;
  }

  // Remove from root
  if (foundParentId === null) {
    return removeFromRoot(itemId, tree.rootIds);
  }

  // Remove from parent
  const success = removeFromParent(itemId, foundParentId, newItems);
  return success ? [...tree.rootIds] : null;
};

/**
 * @description Remove an item from the tree (including all descendants)
 * @param tree - The tree to remove the item from
 * @param itemId - The ID of the item to remove
 * @param parentMap - Map for O(1) parent lookup performance
 * @returns A new tree with the item and its descendants removed
 */
export const removeTreeItem = <T extends BasicTreeItem>({
  tree,
  itemId,
  parentMap,
}: {
  tree: TreeData<T>;
  itemId: TreeItemId;
  parentMap: ParentMap;
}): TreeData<T> => {
  if (!tree.items[itemId]) {
    logError(new Error(`[removeTreeItem] Item with id "${itemId}" not found in the tree`));
    return tree;
  }

  const newItems = getNewItems(tree, itemId);
  const newRootIds = getNewRootIds(itemId, parentMap, tree, newItems);

  if (!newRootIds) {
    return tree;
  }

  return {
    rootIds: newRootIds,
    items: newItems,
  };
};
