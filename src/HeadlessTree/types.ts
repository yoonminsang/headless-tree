import type { ReactNode } from 'react';

export type TreeItemId = number | string;

export type ParentMap = Map<TreeItemId, TreeItemId | null>;

/** @description Map of parent ID to a map of child ID to index position */
export type ChildrenIndexMap = Map<TreeItemId | null, Map<TreeItemId, number>>;

export interface BasicTreeItem<CustomData = unknown> {
  id: TreeItemId;
  /** List of child IDs for the tree item */
  children: TreeItemId[];
  isOpened?: boolean;
  customData: CustomData;
}

export interface TreeData<CustomData> {
  rootIds: TreeItemId[];
  items: Record<TreeItemId, CustomData>;
}

export interface RenderItemParams<CustomData> {
  item: CustomData;
  depth: number;
  /** Parent ID of the current tree item, null if it's a root item */
  parentId: TreeItemId | null;
  // NOTE: isFirstTreeInSameDepth is excluded as it's not considered necessary
  isLastTreeInSameDepth: boolean;
  /**
   * @description Hash table tracking whether vertical connecting lines should be drawn at each depth (whether all items are expanded at the current tree item's depth)
   *
   * @example Needed when drawing vertical connecting lines during tree rendering.
   *
   * For example:
   * ├── Node 1
   * │   ├── Child 1
   * │   └── Child 2
   * └── Node 2
   *     └── Child 3
   *
   * To decide whether to draw the │ line (leftmost),
   * you need to know if there are "siblings left to render" at each depth.
   */
  completeDepthHashTable: Record<number, true>;
  open: VoidFunction;
  close: VoidFunction;
  toggleOpenState: VoidFunction;
}

export interface TreeOptions {
  /**
   * If true, synchronizes the tree with initialTree whenever initialTree changes.
   * Useful when tree data needs to be modified from outside the tree component.
   * However, memoization handling such as useState, useMemo, select, etc. is required for use.
   */
  syncWithInitialTree?: boolean;
}

export interface TreeProps<CustomData extends BasicTreeItem> {
  initialTree: TreeData<CustomData>;
  options?: TreeOptions;
  renderItem: (item: RenderItemParams<CustomData>) => ReactNode;
}
