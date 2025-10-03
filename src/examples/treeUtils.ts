import type { BasicTreeItem, TreeData, TreeItemId } from '../HeadlessTree/types';

/**
 * Move a tree item to a new position
 */
export const moveTreeItem = <T extends BasicTreeItem>(
  tree: TreeData<T>,
  sourceId: TreeItemId,
  targetId: TreeItemId,
  position: 'before' | 'after' | 'inside'
): TreeData<T> => {
  const sourceItem = tree.items[sourceId];
  const targetItem = tree.items[targetId];

  if (!sourceItem || !targetItem) {
    console.warn('[moveTreeItem] Invalid source or target ID');
    return tree;
  }

  // Create deep copies to avoid mutation
  const newItems = { ...tree.items };
  let newRootIds = [...tree.rootIds];

  // Deep copy all items that will be modified
  Object.keys(newItems).forEach((id) => {
    newItems[id] = { ...newItems[id], children: [...newItems[id].children] };
  });

  // Find source's current parent
  let sourceParentId: TreeItemId | null = null;
  for (const [id, item] of Object.entries(newItems)) {
    if (item.children.includes(sourceId)) {
      sourceParentId = id;
      break;
    }
  }
  if (sourceParentId === null && newRootIds.includes(sourceId)) {
    sourceParentId = null;
  }

  // Find target's parent
  let targetParentId: TreeItemId | null = null;
  for (const [id, item] of Object.entries(newItems)) {
    if (item.children.includes(targetId)) {
      targetParentId = id;
      break;
    }
  }
  if (targetParentId === null && newRootIds.includes(targetId)) {
    targetParentId = null;
  }

  // Add source to new position
  if (position === 'inside') {
    // Add as child of target (for folders)
    // First remove from current position
    if (sourceParentId === null) {
      newRootIds = newRootIds.filter((id) => id !== sourceId);
    } else {
      const parent = newItems[sourceParentId];
      if (parent) {
        parent.children = parent.children.filter((id) => id !== sourceId);
      }
    }

    newItems[targetId].children.push(sourceId);
  } else {
    // Handle same parent vs different parent moves
    if (sourceParentId === targetParentId) {
      // Same parent - need to handle index adjustment carefully
      if (sourceParentId === null) {
        // Both are root items
        const sourceIndex = newRootIds.indexOf(sourceId);
        const targetIndex = newRootIds.indexOf(targetId);

        console.log('[moveTreeItem] Same parent (root) move:', {
          sourceId,
          targetId,
          position,
          sourceIndex,
          targetIndex,
          originalRootIds: [...newRootIds]
        });

        // Remove source first
        newRootIds.splice(sourceIndex, 1);
        console.log('[moveTreeItem] After removal:', [...newRootIds]);

        // Recalculate target index after removal
        const newTargetIndex = newRootIds.indexOf(targetId);
        let insertIndex;

        if (position === 'before') {
          if (sourceIndex < targetIndex) {
            // Source was before target, moving it "before" target means right before target's new position
            insertIndex = newTargetIndex;
          } else {
            // Source was after target, moving it "before" target means right before target
            insertIndex = newTargetIndex;
          }
        } else {
          // 'after' position
          insertIndex = newTargetIndex + 1;
        }

        console.log('[moveTreeItem] Insert calculation:', {
          newTargetIndex,
          insertIndex,
          position,
          sourceWasBeforeTarget: sourceIndex < targetIndex
        });

        newRootIds.splice(insertIndex, 0, sourceId);
        console.log('[moveTreeItem] Final rootIds:', [...newRootIds]);
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
    } else {
      // Different parents - simple remove and add
      // Remove source from current position
      if (sourceParentId === null) {
        newRootIds = newRootIds.filter((id) => id !== sourceId);
      } else {
        const parent = newItems[sourceParentId];
        if (parent) {
          parent.children = parent.children.filter((id) => id !== sourceId);
        }
      }

      // Add to new position
      if (targetParentId === null) {
        // Target is root item
        const targetIndex = newRootIds.indexOf(targetId);
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        newRootIds.splice(insertIndex, 0, sourceId);
      } else {
        // Target has parent
        const targetParent = newItems[targetParentId];
        const targetIndex = targetParent.children.indexOf(targetId);
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        targetParent.children.splice(insertIndex, 0, sourceId);
      }
    }
  }

  return {
    rootIds: newRootIds,
    items: newItems,
  };
};

/**
 * Insert a new item into the tree
 */
export const insertTreeItem = <T extends BasicTreeItem>(
  tree: TreeData<T>,
  parentId: TreeItemId | null,
  newItem: T,
  position?: number
): TreeData<T> => {
  const newItems = { ...tree.items, [newItem.id]: newItem };

  if (parentId === null) {
    // Add to root
    const newRootIds = [...tree.rootIds];
    if (position !== undefined && position >= 0 && position <= newRootIds.length) {
      newRootIds.splice(position, 0, newItem.id);
    } else {
      newRootIds.push(newItem.id);
    }
    return { rootIds: newRootIds, items: newItems };
  } else {
    // Add to parent
    const parent = newItems[parentId];
    if (!parent) {
      console.warn('[insertTreeItem] Invalid parent ID');
      return tree;
    }

    const newChildren = [...parent.children];
    if (position !== undefined && position >= 0 && position <= newChildren.length) {
      newChildren.splice(position, 0, newItem.id);
    } else {
      newChildren.push(newItem.id);
    }

    newItems[parentId] = { ...parent, children: newChildren };
    return { rootIds: tree.rootIds, items: newItems };
  }
};

/**
 * Remove an item from the tree (including all descendants)
 */
export const removeTreeItem = <T extends BasicTreeItem>(tree: TreeData<T>, itemId: TreeItemId): TreeData<T> => {
  const item = tree.items[itemId];

  if (!item) {
    console.warn('[removeTreeItem] Invalid item ID');
    return tree;
  }

  // Create deep copies to avoid mutation
  const newItems = { ...tree.items };
  const newRootIds = [...tree.rootIds];

  // Deep copy all items that will be modified
  Object.keys(newItems).forEach((id) => {
    newItems[id] = { ...newItems[id], children: [...newItems[id].children] };
  });

  // Recursively collect all descendants
  const collectDescendants = (id: TreeItemId): TreeItemId[] => {
    const current = newItems[id];
    if (!current) return [];

    const descendants = [id];
    for (const childId of current.children) {
      descendants.push(...collectDescendants(childId));
    }
    return descendants;
  };

  const toRemove = collectDescendants(itemId);

  // Remove all descendants from items
  toRemove.forEach((id) => {
    delete newItems[id];
  });

  // Remove from parent's children or root
  let found = false;
  for (const parentItem of Object.values(newItems)) {
    const index = parentItem.children.indexOf(itemId);
    if (index !== -1) {
      parentItem.children.splice(index, 1);
      found = true;
      break;
    }
  }

  // If not found in any parent, check root
  if (!found) {
    const rootIndex = newRootIds.indexOf(itemId);
    if (rootIndex !== -1) {
      newRootIds.splice(rootIndex, 1);
    }
  }

  return {
    rootIds: newRootIds.filter((id) => !toRemove.includes(id)),
    items: newItems,
  };
};

/**
 * Check if an item can be dropped on a target (prevents dropping on descendants)
 */
export const canDropItem = <T extends BasicTreeItem>(
  tree: TreeData<T>,
  sourceId: TreeItemId,
  targetId: TreeItemId
): boolean => {
  if (sourceId === targetId) return false;

  // Check if target is a descendant of source
  const isDescendant = (ancestorId: TreeItemId, candidateId: TreeItemId): boolean => {
    const ancestor = tree.items[ancestorId];
    if (!ancestor) return false;

    if (ancestor.children.includes(candidateId)) return true;

    return ancestor.children.some((childId) => isDescendant(childId, candidateId));
  };

  return !isDescendant(sourceId, targetId);
};
