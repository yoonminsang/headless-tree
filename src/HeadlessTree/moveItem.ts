// const moveItem = useCallback(
//     (sourceId: TreeItemId, targetId: TreeItemId, position: 'before' | 'after' | 'inside') => {
//       const sourceItem = baseTree.items[sourceId];
//       const targetItem = baseTree.items[targetId];

//       if (!sourceItem || !targetItem) {
//         logError(new Error('[moveItem] Invalid source or target ID'), {
//           sourceId,
//           targetId,
//           availableIds: Object.keys(baseTree.items),
//         });
//         return;
//       }

//       // Create deep copies to avoid mutation
//       const newItems = { ...baseTree.items };
//       let newRootIds = [...baseTree.rootIds];

//       // Deep copy all items that will be modified
//       Object.keys(newItems).forEach((id) => {
//         newItems[id] = { ...newItems[id], children: [...newItems[id].children] };
//       });

//       // Find source's current parent
//       let sourceParentId: TreeItemId | null = null;
//       for (const [id, item] of Object.entries(newItems)) {
//         if (item.children.includes(sourceId)) {
//           sourceParentId = id;
//           break;
//         }
//       }
//       if (sourceParentId === null && newRootIds.includes(sourceId)) {
//         sourceParentId = null;
//       }

//       // Find target's parent
//       let targetParentId: TreeItemId | null = null;
//       for (const [id, item] of Object.entries(newItems)) {
//         if (item.children.includes(targetId)) {
//           targetParentId = id;
//           break;
//         }
//       }
//       if (targetParentId === null && newRootIds.includes(targetId)) {
//         targetParentId = null;
//       }

//       // Add source to new position
//       if (position === 'inside') {
//         // Add as child of target (for folders)
//         // First remove from current position
//         if (sourceParentId === null) {
//           newRootIds = newRootIds.filter((id) => id !== sourceId);
//         } else {
//           const parent = newItems[sourceParentId];
//           if (parent) {
//             parent.children = parent.children.filter((id) => id !== sourceId);
//           }
//         }

//         newItems[targetId].children.push(sourceId);
//       } else {
//         // Handle same parent vs different parent moves
//         if (sourceParentId === targetParentId) {
//           // Same parent - need to handle index adjustment carefully
//           if (sourceParentId === null) {
//             // Both are root items
//             const sourceIndex = newRootIds.indexOf(sourceId);

//             // Remove source first
//             newRootIds.splice(sourceIndex, 1);

//             // Recalculate target index after removal
//             const newTargetIndex = newRootIds.indexOf(targetId);
//             const insertIndex = position === 'before' ? newTargetIndex : newTargetIndex + 1;

//             newRootIds.splice(insertIndex, 0, sourceId);
//           } else {
//             // Both have same parent
//             const parent = newItems[sourceParentId];
//             const sourceIndex = parent.children.indexOf(sourceId);

//             // Remove source first
//             parent.children.splice(sourceIndex, 1);

//             // Recalculate target index after removal
//             const newTargetIndex = parent.children.indexOf(targetId);
//             const insertIndex = position === 'before' ? newTargetIndex : newTargetIndex + 1;

//             parent.children.splice(insertIndex, 0, sourceId);
//           }
//         } else {
//           // Different parents - simple remove and add
//           // Remove source from current position
//           if (sourceParentId === null) {
//             newRootIds = newRootIds.filter((id) => id !== sourceId);
//           } else {
//             const parent = newItems[sourceParentId];
//             if (parent) {
//               parent.children = parent.children.filter((id) => id !== sourceId);
//             }
//           }

//           // Add to new position
//           if (targetParentId === null) {
//             // Target is root item
//             const targetIndex = newRootIds.indexOf(targetId);
//             const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
//             newRootIds.splice(insertIndex, 0, sourceId);
//           } else {
//             // Target has parent
//             const targetParent = newItems[targetParentId];
//             const targetIndex = targetParent.children.indexOf(targetId);
//             const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
//             targetParent.children.splice(insertIndex, 0, sourceId);
//           }
//         }
//       }

//       const newTree: TreeData<CustomData> = {
//         rootIds: newRootIds,
//         items: newItems,
//       };

//       // Update internal state
//       setBasicTree(newTree);
//     },
//     [baseTree]
//   );
