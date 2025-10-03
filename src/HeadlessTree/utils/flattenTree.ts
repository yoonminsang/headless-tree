import { logError } from '../../internal/logError';
import type { BasicTreeItem, TreeData, TreeItemId } from '../types';

interface FlattenedTreeItem<CustomData> {
  item: CustomData;
  depth: number;
  parentId: TreeItemId | null;
  isLastTreeInSameDepth: boolean;
  completeDepthHashTable: Record<number, true>;
}

interface StackItem {
  id: TreeItemId;
  depth: number;
  parentId: TreeItemId | null;
  isLastTreeInSameDepth: boolean;
  completeDepthHashTable: Record<number, true>;
}

/** @description Flatten the tree into an array for rendering. */
export function flattenTree<CustomData extends BasicTreeItem>(
  tree: TreeData<CustomData>
): FlattenedTreeItem<CustomData>[] {
  const initialDepth: number = 0;
  const initialCompleteDepthHashTable: Record<number, true> = {};
  const initialParentId: TreeItemId | null = null;

  const flattenedItems: FlattenedTreeItem<CustomData>[] = [];
  const stack: StackItem[] = [];

  // NOTE: Add initial root items to the stack
  // NOTE: Add in reverse order to maintain order
  for (let i = tree.rootIds.length - 1; i >= 0; i--) {
    stack.push({
      id: tree.rootIds[i],
      depth: initialDepth,
      completeDepthHashTable: initialCompleteDepthHashTable,
      parentId: initialParentId,
      isLastTreeInSameDepth: i === tree.rootIds.length - 1,
    });
  }

  while (stack.length > 0) {
    const { id, depth, completeDepthHashTable, parentId, isLastTreeInSameDepth } = stack.pop()!;
    const item = tree.items[id];

    if (!item) {
      logError(new Error('[flattenTree] Invalid item ID detected'), {
        id,
        availableIds: Object.keys(tree.items),
      });
      continue;
    }

    flattenedItems.push({
      item,
      depth,
      isLastTreeInSameDepth,
      parentId,
      completeDepthHashTable,
    });

    if (item.isOpened && item.children?.length > 0) {
      const newCompleteDepthHashTable: Record<number, true> = isLastTreeInSameDepth
        ? completeDepthHashTable
        : { ...completeDepthHashTable, [depth]: true };

      const invalidChildren = item.children.filter((childId) => !tree.items[childId]);
      if (invalidChildren.length > 0) {
        logError(new Error('[flattenTree] Invalid children detected'), {
          parentId: id,
          invalidChildren,
          validChildren: item.children.filter((childId) => tree.items[childId]),
        });
      }

      // NOTE: Add in reverse order to maintain order
      for (let i = item.children.length - 1; i >= 0; i--) {
        if (tree.items[item.children[i]]) {
          stack.push({
            id: item.children[i],
            depth: depth + 1,
            completeDepthHashTable: newCompleteDepthHashTable,
            parentId: item.id,
            isLastTreeInSameDepth: i === item.children.length - 1,
          });
        }
      }
    }
  }

  return flattenedItems;
}
