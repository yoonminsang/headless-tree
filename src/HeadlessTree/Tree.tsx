import { forwardRef, useImperativeHandle, useMemo, type ReactElement, type Ref } from 'react';
import { flattenTree } from './utils/flattenTree';
import type { BasicTreeItem, TreeProps } from './types';
import { useTreeState } from './useTreeState';

export type TreeRef<CustomData extends BasicTreeItem> = ReturnType<typeof useTreeState<CustomData>>;

function TreeComponent<T extends BasicTreeItem>(
  { initialTree, options, renderItem }: TreeProps<T>,
  ref: Ref<TreeRef<T>>
) {
  const { tree, parentMap, childrenIndexMap, open, close, toggleOpen, openAll, closeAll, insertItem, removeItem } =
    useTreeState({
      initialTree,
      options,
    });
  const flattenedTree = useMemo(() => flattenTree(tree), [tree]);

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
    }),
    [tree, parentMap, childrenIndexMap, insertItem, removeItem, open, close, toggleOpen, openAll, closeAll]
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
          toggleOpenState: () => toggleOpen(item.item.id),
        })
      )}
    </>
  );
}

export const Tree = forwardRef(TreeComponent) as <T extends BasicTreeItem>(
  props: TreeProps<T> & { ref?: React.Ref<TreeRef<T>> }
) => ReactElement;
