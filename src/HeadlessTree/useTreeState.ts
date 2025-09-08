import { produce } from 'immer';
import { useCallback, useState } from 'react';

import { logError } from '../internal/logError';
import { useDidUpdate } from '../internal/useDidUpdate';
import type { BasicTreeItem, TreeData, TreeItemId, TreeProps } from './types';

/** @description Manage the state of a tree. */
export const useTreeState = <CustomData extends BasicTreeItem>({
  initialTree,
  options,
}: Pick<TreeProps<CustomData>, 'initialTree' | 'options'>) => {
  const [tree, setTree] = useState<TreeData<CustomData>>(initialTree);

  const changeIsOpenedState = useCallback((id: TreeItemId, value: boolean) => {
    setTree(
      produce((state) => {
        if (!state.items[id]) {
          logError(new Error('[useTreeState] Invalid item ID'), {
            id,
            availableIds: Object.keys(state.items),
          });
          return;
        }
        state.items[id].isOpened = value;
      })
    );
  }, []);

  const changeAllIsOpenedState = useCallback((value: boolean) => {
    setTree(
      produce((state) => {
        Object.keys(state.items).forEach((id) => {
          state.items[id].isOpened = value;
        });
      })
    );
  }, []);

  const open = useCallback((id: TreeItemId) => changeIsOpenedState(id, true), [changeIsOpenedState]);
  const close = useCallback((id: TreeItemId) => changeIsOpenedState(id, false), [changeIsOpenedState]);
  const toggleOpen = useCallback((id: TreeItemId) => {
    setTree(
      produce((state) => {
        if (!state.items[id]) {
          logError(new Error('[useTreeState] Invalid item ID'), {
            id,
            availableIds: Object.keys(state.items),
          });
          return;
        }
        state.items[id].isOpened = !state.items[id].isOpened;
      })
    );
  }, []);
  const openAll = useCallback(() => changeAllIsOpenedState(true), [changeAllIsOpenedState]);
  const closeAll = useCallback(() => changeAllIsOpenedState(false), [changeAllIsOpenedState]);

  useDidUpdate(() => {
    if (options?.syncWithInitialTree) {
      setTree(initialTree);
    }
  }, [initialTree, options?.syncWithInitialTree]);

  return {
    tree,
    open,
    close,
    toggleOpen,
    openAll,
    closeAll,
  };
};
