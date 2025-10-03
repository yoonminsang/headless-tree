import { logError } from '../../internal/logError';
import type { BasicTreeItem, ChildrenIndexMap, TreeData, TreeItemId } from '../types';

type InsertPosition =
  | number // Index-based insertion (0 = first position, 1 = second position, etc.)
  | 'first' // Insert at the beginning of children array
  | 'last' // Insert at the end of children array
  | { before: TreeItemId } // Insert before the specified item ID
  | { after: TreeItemId }; // Insert after the specified item ID

export const insertIdIntoArray = ({
  position,
  treeItemIds,
  newItem,
  parentId,
  childrenIndexMap,
}: {
  position: InsertPosition;
  treeItemIds: TreeItemId[];
  newItem: BasicTreeItem;
  parentId: TreeItemId | null;
  childrenIndexMap: ChildrenIndexMap;
}): TreeItemId[] => {
  const result = [...treeItemIds];
  if (position === 'first') {
    result.unshift(newItem.id);
    return result;
  }
  if (position === 'last') {
    result.push(newItem.id);
    return result;
  }
  if (typeof position === 'object' && 'before' in position) {
    const index = childrenIndexMap.get(parentId)?.get(position.before);
    if (index === undefined) {
      logError(new Error(`[insertTreeItem] Item with id "${position.before}" not found in the tree`));
      return result;
    }
    result.splice(index, 0, newItem.id);
    return result;
  }
  if (typeof position === 'object' && 'after' in position) {
    const index = childrenIndexMap.get(parentId)?.get(position.after);
    if (index === undefined) {
      logError(new Error(`[insertTreeItem] Item with id "${position.after}" not found in the tree`));
      return result;
    }
    result.splice(index + 1, 0, newItem.id);
    return result;
  }
  if (position < 0 || position > result.length) {
    logError(new Error(`[insertTreeItem] Position ${position} is out of bounds (0-${result.length})`));
    return result;
  }
  // position: number
  result.splice(position, 0, newItem.id);
  return result;
};

/** @description Insert a new item into the tree */
export const insertTreeItem = <T extends BasicTreeItem>({
  tree,
  parentId,
  newItem,
  position,
  childrenIndexMap,
}: {
  tree: TreeData<T>;
  parentId: TreeItemId | null;
  newItem: T;
  position: InsertPosition;
  childrenIndexMap: ChildrenIndexMap;
}): TreeData<T> => {
  const newRootIds = [...tree.rootIds];
  const newTreeItems = { ...tree.items, [newItem.id]: newItem };

  // NOTE: Add to root
  if (parentId === null) {
    return {
      rootIds: insertIdIntoArray({ position, treeItemIds: newRootIds, newItem, parentId, childrenIndexMap }),
      items: newTreeItems,
    };
  }

  if (!newTreeItems[parentId]) {
    logError(new Error(`[insertTreeItem] Parent item with id "${parentId}" not found in the tree`));
    return tree;
  }

  const newChildren = insertIdIntoArray({
    position,
    treeItemIds: newTreeItems[parentId].children,
    newItem,
    parentId,
    childrenIndexMap,
  });
  newTreeItems[parentId] = { ...newTreeItems[parentId], children: newChildren };
  return { rootIds: newRootIds, items: newTreeItems };
};
