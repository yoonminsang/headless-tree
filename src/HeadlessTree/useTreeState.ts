import { useCallback, useMemo, useState } from 'react';

import { logError } from '../internal/logError';
import { useDidUpdate } from '../internal/useDidUpdate';
import type { BasicTreeItem, ChildrenIndexMap, ParentMap, TreeData, TreeItemId, TreeProps } from './types';
import { buildChildrenIndexMap } from './utils/buildChildrenIndexMap';
import { buildParentMap } from './utils/buildParentMap';
import { insertTreeItem } from './utils/insertTreeItem';
import { removeTreeItem } from './utils/removeTreeItem';
import { moveTreeItem } from './utils/moveTreeItem';

// Helper function to extract opened IDs from tree items
const extractOpenedIds = <T extends BasicTreeItem>(items: Record<TreeItemId, T>): Set<TreeItemId> => {
  const openedIds = new Set<TreeItemId>();
  Object.entries(items).forEach(([id, item]) => {
    if (item.isOpened) {
      openedIds.add(id);
    }
  });
  return openedIds;
};

/** @description Manage the state of a tree with separated open/close state for better performance. */
export const useTreeState = <CustomData extends BasicTreeItem>({
  initialTree,
  options,
}: Pick<TreeProps<CustomData>, 'initialTree' | 'options'>) => {
  const [baseTree, setBasicTree] = useState<TreeData<CustomData>>(initialTree);
  const [openedIds, setOpenedIds] = useState<Set<TreeItemId>>(() => extractOpenedIds(initialTree.items));

  const parentMap = useMemo<ParentMap>(() => buildParentMap(baseTree), [baseTree]);
  const childrenIndexMap = useMemo<ChildrenIndexMap>(() => buildChildrenIndexMap(baseTree), [baseTree]);

  // Merge base tree with open state for rendering
  const tree = useMemo<TreeData<CustomData>>(() => {
    const items: Record<TreeItemId, CustomData> = {};
    Object.entries(baseTree.items).forEach(([id, item]) => {
      items[id] = { ...item, isOpened: openedIds.has(id) };
    });
    return { rootIds: baseTree.rootIds, items };
  }, [baseTree, openedIds]);

  const toggleOpen = useCallback(
    (id: TreeItemId) => {
      if (!baseTree.items[id]) {
        logError(new Error('[useTreeState] Invalid item ID'), {
          id,
          availableIds: Object.keys(baseTree.items),
        });
        return;
      }

      setOpenedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    },
    [baseTree.items]
  );

  const open = useCallback(
    (id: TreeItemId) => {
      if (!baseTree.items[id]) {
        logError(new Error('[useTreeState] Invalid item ID'), {
          id,
          availableIds: Object.keys(baseTree.items),
        });
        return;
      }
      setOpenedIds((prev) => new Set(prev).add(id));
    },
    [baseTree.items]
  );

  const close = useCallback(
    (id: TreeItemId) => {
      if (!baseTree.items[id]) {
        logError(new Error('[useTreeState] Invalid item ID'), {
          id,
          availableIds: Object.keys(baseTree.items),
        });
        return;
      }
      setOpenedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    },
    [baseTree.items]
  );

  const openAll = useCallback(() => {
    setOpenedIds(new Set(Object.keys(baseTree.items)));
  }, [baseTree.items]);

  const closeAll = useCallback(() => {
    setOpenedIds(new Set());
  }, []);

  const insertItem = useCallback(
    (parentId: TreeItemId | null, newItem: CustomData, position: Parameters<typeof insertTreeItem>[0]['position']) => {
      setBasicTree((prev) =>
        insertTreeItem({
          tree: prev,
          parentId,
          newItem,
          position,
          childrenIndexMap,
        })
      );
    },
    [childrenIndexMap]
  );

  const removeItem = useCallback(
    (itemId: TreeItemId) => {
      setBasicTree((prev) =>
        removeTreeItem({
          tree: prev,
          itemId,
          parentMap,
        })
      );
    },
    [parentMap]
  );

  const moveItem = useCallback(
    (sourceId: TreeItemId, target: Parameters<typeof moveTreeItem>[0]['target']) => {
      setBasicTree((prev) =>
        moveTreeItem({
          tree: prev,
          parentMap,
          sourceId,
          target,
        })
      );
    },
    [parentMap]
  );

  useDidUpdate(() => {
    if (options?.syncWithInitialTree) {
      setOpenedIds(extractOpenedIds(initialTree.items));
      setBasicTree(initialTree);
    }
  }, [initialTree, options?.syncWithInitialTree]);

  return {
    tree,
    parentMap,
    childrenIndexMap,
    open,
    close,
    toggleOpen,
    openAll,
    closeAll,
    insertItem,
    removeItem,
    moveItem,
  };
};
