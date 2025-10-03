import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type Ref,
} from 'react';
import { flattenTree } from './utils/flattenTree';
import type { BasicTreeItem, TreeProps } from './types';
import { useTreeState } from './useTreeState';

export type VirtualizedTreeRef<CustomData extends BasicTreeItem> = ReturnType<typeof useTreeState<CustomData>> & {
  virtualizer: Virtualizer<HTMLDivElement, Element>;
};

export interface VirtualizedTreeProps<CustomData extends BasicTreeItem>
  extends TreeProps<CustomData>,
    Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Height of the virtualized container */
  height: number | string;
  /** Estimated size of each item in pixels */
  estimateSize: (index: number) => number;
  /** Number of items to render outside the visible area */
  overscan?: number;
}

/** @description Headless Virtualized Tree Component */
function VirtualizedTreeComponent<T extends BasicTreeItem>(
  {
    initialTree,
    options,
    renderItem,
    height,
    estimateSize,
    overscan = 5,
    style,
    ...containerProps
  }: VirtualizedTreeProps<T>,
  ref: Ref<VirtualizedTreeRef<T>>
) {
  const { tree, parentMap, childrenIndexMap, insertItem, removeItem, open, close, toggleOpen, openAll, closeAll } =
    useTreeState({
      initialTree,
      options,
    });
  const flattenedTree = useMemo(() => flattenTree(tree), [tree]);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: flattenedTree.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
  });

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
      virtualizer,
      insertItem,
      removeItem,
    }),
    [tree, parentMap, childrenIndexMap, insertItem, removeItem, open, close, toggleOpen, openAll, closeAll, virtualizer]
  );

  return (
    <div
      ref={parentRef}
      {...containerProps}
      style={{
        height,
        overflow: 'auto',
        ...style,
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const flatItem = flattenedTree[virtualItem.index];
          return (
            <div
              key={flatItem.item.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem({
                open: () => open(flatItem.item.id),
                close: () => close(flatItem.item.id),
                depth: flatItem.depth,
                isLastTreeInSameDepth: flatItem.isLastTreeInSameDepth,
                completeDepthHashTable: flatItem.completeDepthHashTable,
                item: flatItem.item,
                parentId: flatItem.parentId,
                toggleOpenState: () => toggleOpen(flatItem.item.id),
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const VirtualizedTree = forwardRef(VirtualizedTreeComponent) as <T extends BasicTreeItem>(
  props: VirtualizedTreeProps<T> & { ref?: React.Ref<VirtualizedTreeRef<T>> }
) => ReactElement;
