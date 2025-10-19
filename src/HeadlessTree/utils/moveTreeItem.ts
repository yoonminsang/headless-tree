import { isNil } from '../../internal/isNil';
import { logError } from '../../internal/logError';
import type { BasicTreeItem, ParentMap, TreeData, TreeItemId } from '../types';

type MoveTarget =
  | { parentId: TreeItemId | null; index: number } // Insert at specific index
  | { parentId: TreeItemId | null; position: 'first' } // Insert at the beginning
  | { parentId: TreeItemId | null; position: 'last' }; // Insert at the end

/** @description Move a tree item to a new position */
export const moveTreeItem = <T extends BasicTreeItem>({
  tree,
  parentMap,
  sourceId,
  target,
}: {
  tree: TreeData<T>;
  parentMap: ParentMap;
  sourceId: TreeItemId;
  target: MoveTarget;
}): TreeData<T> => {
  const sourceItem = tree.items[sourceId];
  const { parentId } = target;

  if (!sourceItem) {
    logError(new Error('[moveTreeItem] Invalid source ID'), {
      sourceId,
      availableIds: Object.keys(tree.items),
    });
    return tree;
  }

  if (!isNil(parentId) && !tree.items[parentId]) {
    logError(new Error('[moveTreeItem] Invalid parent ID'), {
      parentId,
      availableIds: Object.keys(tree.items),
    });
    return tree;
  }

  // Create copies to avoid mutation
  const newItems = { ...tree.items };
  const newRootIds = [...tree.rootIds];

  const sourceParentId = parentMap.get(sourceId);

  // NOTE: 1. Remove source from its current parent
  if (isNil(sourceParentId)) {
    // NOTE: Remove from root
    const sourceIndex = newRootIds.indexOf(sourceId);
    if (sourceIndex !== -1) {
      newRootIds.splice(sourceIndex, 1);
    }
  } else {
    // NOTE: Remove from parent's children
    const parent = newItems[sourceParentId];
    if (parent) {
      const newChildren = parent.children.filter((id) => id !== sourceId);
      newItems[sourceParentId] = { ...parent, children: newChildren };
    }
  }

  // NOTE: 2. Calculate insert index
  const insertIndex = (() => {
    if ('index' in target) {
      return target.index;
    }
    if (target.position === 'first') {
      return 0;
    }
    // 'last'
    if (isNil(parentId)) {
      return newRootIds.length;
    }
    return newItems[parentId].children.length;
  })();

  // NOTE: 3. Insert source at new position
  if (isNil(parentId)) {
    // NOTE: Insert into root
    newRootIds.splice(insertIndex, 0, sourceId);
  } else {
    // NOTE: Insert into parent's children
    const parent = { ...newItems[parentId], children: [...newItems[parentId].children] };
    parent.children.splice(insertIndex, 0, sourceId);
    newItems[parentId] = parent;
  }

  return {
    ...tree,
    items: newItems,
    rootIds: newRootIds,
  };
};
