import { logError } from '../../internal/logError';
import type { BasicTreeItem, ParentMap, TreeData, TreeItemId } from '../types';

type MovePosition = 'before' | 'after' | 'inside';
// type MovePosition =
//   | number // Index-based insertion (0 = first position, 1 = second position, etc.)
//   | 'first' // Insert at the beginning of children array
//   | 'last' // Insert at the end of children array
//   | { before: TreeItemId } // Insert before the specified item ID
//   | { after: TreeItemId }; // Insert after the specified item ID

// position의 인터페이스를 조금 고민해보자.

/** @description Move a tree item to a new position */
export const moveTreeItem = <T extends BasicTreeItem>(
  tree: TreeData<T>,
  parentMap: ParentMap,
  sourceId: TreeItemId,
  targetId: TreeItemId,
  position: MovePosition
): TreeData<T> => {
  const sourceItem = tree.items[sourceId];
  const targetItem = tree.items[targetId];

  if (!sourceItem || !targetItem) {
    logError(new Error('[moveTreeItem] Invalid source or target ID'), {
      sourceId,
      targetId,
      availableIds: Object.keys(tree.items),
    });
    return tree;
  }

  // Create deep copies to avoid mutation
  const newItems = { ...tree.items };
  const newRootIds = [...tree.rootIds];

  // 아니 이건 나중에 처리하면 돼
  // Deep copy all items that will be modified
  //   Object.keys(newItems).forEach((id) => {
  //     newItems[id] = {
  //       ...newItems[id],
  //       children: [...newItems[id].children],
  //     };
  //   });

  const sourceParentId = parentMap.get(sourceId);
  const targetParentId = parentMap.get(targetId);
  const isSameParent = sourceParentId === targetParentId;

  if (position === 'inside') {
    // TODO
  }

  if (isSameParent) {
    // Same parent - need to handle index adjustment carefully
    if (sourceParentId === null || sourceParentId === undefined) {
      // Both are root items
      const sourceIndex = newRootIds.indexOf(sourceId);

      // Remove source first
      newRootIds.splice(sourceIndex, 1);

      // Recalculate target index after removal
      const newTargetIndex = newRootIds.indexOf(targetId);
      const insertIndex = position === 'before' ? newTargetIndex : newTargetIndex + 1;

      newRootIds.splice(insertIndex, 0, sourceId);
    } else {
      // Both have same parent
      const parent = newItems[sourceParentId];
      const sourceIndex = parent.children.indexOf(sourceId);

      // Remove source first
      parent.children.splice(sourceIndex, 1);

      // Recalculate target index after removal
      const newTargetIndex = parent.children.indexOf(targetId);
      const insertIndex = position === 'before' ? newTargetIndex : newTargetIndex + 1;

      parent.children.splice(insertIndex, 0, sourceId);
    }
  }
  // isNotSameParent
  else {
    //
  }

  return tree;
};
