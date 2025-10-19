import { forwardRef, useImperativeHandle, useMemo, type ReactElement, type Ref } from 'react';
import { flattenTree } from './utils/flattenTree';
import type { BasicTreeItem, TreeProps } from './types';
import { useTreeState } from './useTreeState';

export type TreeRef<CustomData extends BasicTreeItem> = ReturnType<typeof useTreeState<CustomData>>;

function TreeComponent<T extends BasicTreeItem>(
  { initialTree, options, renderItem }: TreeProps<T>,
  ref: Ref<TreeRef<T>>
) {
  const {
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
  } = useTreeState({
    initialTree,
    options,
  });
  const flattenedTree = useMemo(() => flattenTree(tree, childrenIndexMap), [tree, childrenIndexMap]);

  useImperativeHandle(
    ref,
    () => ({
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
    }),
    [tree, parentMap, childrenIndexMap, insertItem, removeItem, open, close, toggleOpen, openAll, closeAll, moveItem]
  );

  return (
    <>
      {flattenedTree.map((item) =>
        renderItem({
          open: () => open(item.item.id),
          close: () => close(item.item.id),
          depth: item.depth,
          isLastTreeInSameDepth: item.isLastTreeInSameDepth,
          completeDepthHashTable: item.completeDepthHashTable,
          item: item.item,
          parentId: item.parentId,
          flatIndex: item.flatIndex,
          childIndex: item.childIndex,
          toggleOpenState: () => toggleOpen(item.item.id),
        })
      )}
    </>
  );
}

export const Tree = forwardRef(TreeComponent) as <T extends BasicTreeItem>(
  props: TreeProps<T> & { ref?: React.Ref<TreeRef<T>> }
) => ReactElement;
