import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { flattenTree } from './flattenTree';
import type { BasicTreeItem, TreeProps } from './types';
import { useTreeState } from './useTreeState';

export type TreeRef<T extends BasicTreeItem> = ReturnType<typeof useTreeState<T>>;

/** @description Headless Tree Component */
export const Tree = forwardRef<TreeRef<BasicTreeItem>, TreeProps<BasicTreeItem>>(
  <T extends BasicTreeItem>({ initialTree, options, renderItem }: TreeProps<T>, ref: React.Ref<TreeRef<T>>) => {
    const { tree, open, close, toggleOpen, openAll, closeAll } = useTreeState({ initialTree, options });
    const flattenedTree = useMemo(() => flattenTree(tree), [tree]);

    useImperativeHandle(
      ref,
      () => ({
        tree,
        open,
        close,
        toggleOpen,
        openAll,
        closeAll,
      }),
      [tree, open, close, toggleOpen, openAll, closeAll]
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
);
