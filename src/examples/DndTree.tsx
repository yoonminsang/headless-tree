import React, { useRef, useState } from 'react';
import { type BasicTreeItem, canMoveItem, Tree, type TreeData, type TreeItemId, type TreeRef } from '../HeadlessTree';
import { Button, ControlsPanel, type FileItem, TreeContainer, TreeItemRenderer } from './ui';

type DropPosition = 'before' | 'after' | 'inside';

// Constants
const DROP_ZONE = {
  FOLDER_BEFORE_THRESHOLD: 0.25,
  FOLDER_AFTER_THRESHOLD: 0.75,
  FILE_MIDDLE_THRESHOLD: 0.5,
} as const;

const DROP_INDICATOR_STYLE = {
  height: 2,
  backgroundColor: '#3b82f6',
  zIndex: 10,
  pointerEvents: 'none' as const,
};

const DROP_INSIDE_STYLE = {
  backgroundColor: '#dbeafe',
  borderRadius: '4px',
  transition: 'background-color 0.15s',
};

interface DragState {
  draggedId: TreeItemId | null;
  dropTargetId: TreeItemId | null;
  dropPosition: DropPosition | null;
}

interface DndTreeItemProps {
  item: BasicTreeItem<FileItem>;
  depth: number;
  toggleOpenState: () => void;
  parentId: TreeItemId | null;
  childIndex: number;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: DropPosition | null;
  onDragStart: (id: TreeItemId) => void;
  onDragEnd: () => void;
  onDragOver: (id: TreeItemId, position: DropPosition, event: React.DragEvent) => void;
  onDrop: () => void;
}

const DndTreeItem: React.FC<DndTreeItemProps> = ({
  item,
  depth,
  toggleOpenState,
  isDragging,
  isDropTarget,
  dropPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id.toString());
    onDragStart(item.id);
  };

  const calculateDropPosition = (rect: DOMRect, clientY: number, isFolder: boolean): DropPosition => {
    const y = clientY - rect.top;
    const height = rect.height;
    const relativeY = y / height;

    if (isFolder) {
      if (relativeY < DROP_ZONE.FOLDER_BEFORE_THRESHOLD) return 'before';
      if (relativeY > DROP_ZONE.FOLDER_AFTER_THRESHOLD) return 'after';
      return 'inside';
    }

    return relativeY < DROP_ZONE.FILE_MIDDLE_THRESHOLD ? 'before' : 'after';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!itemRef.current || isDragging) return;

    const rect = itemRef.current.getBoundingClientRect();
    const isFolder = item.customData.type === 'folder';
    const position = calculateDropPosition(rect, e.clientY, isFolder);

    onDragOver(item.id, position, e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop();
  };

  const showIndicator = isDropTarget && dropPosition;

  const renderDropIndicator = (position: 'before' | 'after') => {
    if (!showIndicator || dropPosition !== position) return null;

    return (
      <div
        style={{
          position: 'absolute',
          [position === 'before' ? 'top' : 'bottom']: -2,
          left: depth * 24,
          right: 0,
          ...DROP_INDICATOR_STYLE,
        }}
      />
    );
  };

  return (
    <div
      ref={itemRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
      }}
    >
      {renderDropIndicator('before')}
      {renderDropIndicator('after')}

      <div
        style={
          showIndicator && dropPosition === 'inside' ? DROP_INSIDE_STYLE : { transition: 'background-color 0.15s' }
        }
      >
        <TreeItemRenderer
          item={item}
          depth={depth}
          toggleOpenState={toggleOpenState}
          showSize={true}
          iconType="emoji"
        />
      </div>
    </div>
  );
};

interface DndTreeProps {
  initialTree: TreeData<BasicTreeItem<FileItem>>;
}

export const DndTree: React.FC<DndTreeProps> = ({ initialTree }) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedId: null,
    dropTargetId: null,
    dropPosition: null,
  });
  const treeRef = useRef<TreeRef<BasicTreeItem<FileItem>>>(null);

  const handleDragStart = (id: TreeItemId) => {
    setDragState({
      draggedId: id,
      dropTargetId: null,
      dropPosition: null,
    });
  };

  const handleDragEnd = () => {
    setDragState({
      draggedId: null,
      dropTargetId: null,
      dropPosition: null,
    });
  };

  const handleDragOver = (targetId: TreeItemId, position: DropPosition, event: React.DragEvent) => {
    event.preventDefault();

    const { draggedId } = dragState;
    if (!draggedId || !treeRef.current) return;

    // Check if drop is valid
    const tree = treeRef.current.tree;
    if (!canMoveItem(tree, draggedId, targetId)) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }

    event.dataTransfer.dropEffect = 'move';
    setDragState({
      draggedId,
      dropTargetId: targetId,
      dropPosition: position,
    });
  };

  const getTargetIndex = (
    tree: TreeData<BasicTreeItem<FileItem>>,
    targetId: TreeItemId,
    parentId: TreeItemId | null | undefined
  ): number => {
    if (parentId !== null && parentId !== undefined) {
      const parent = tree.items[parentId];
      return parent.children.indexOf(targetId);
    }
    return tree.rootIds.indexOf(targetId);
  };

  const handleDrop = () => {
    const { draggedId, dropTargetId, dropPosition } = dragState;

    handleDragEnd();

    if (!draggedId || !dropTargetId || !dropPosition || !treeRef.current) {
      return;
    }

    if (dropPosition === 'inside') {
      treeRef.current.moveItem(draggedId, {
        parentId: dropTargetId,
        position: 'last',
      });
      return;
    }

    const { tree, parentMap } = treeRef.current;
    const targetParentId = parentMap.get(dropTargetId) ?? null;
    const targetIndex = getTargetIndex(tree, dropTargetId, targetParentId);
    const insertIndex = dropPosition === 'after' ? targetIndex + 1 : targetIndex;

    treeRef.current.moveItem(draggedId, {
      parentId: targetParentId,
      index: insertIndex,
    });
  };

  const draggedItem = dragState.draggedId && treeRef.current?.tree.items[dragState.draggedId];

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <ControlsPanel>
        <Button onClick={() => treeRef.current?.openAll()}>Expand All</Button>
        <Button onClick={() => treeRef.current?.closeAll()}>Collapse All</Button>
        <span
          style={{
            color: '#666',
            fontSize: '13px',
            fontWeight: 'normal',
          }}
        >
          {draggedItem ? `Dragging: ${draggedItem.customData.name}` : 'Drag items to reorder'}
        </span>
      </ControlsPanel>

      <TreeContainer>
        <Tree
          ref={treeRef}
          initialTree={initialTree}
          options={{ syncWithInitialTree: false }}
          renderItem={({ item, depth, toggleOpenState, parentId, childIndex }) => (
            <DndTreeItem
              key={item.id}
              item={item}
              depth={depth}
              toggleOpenState={toggleOpenState}
              parentId={parentId}
              childIndex={childIndex}
              isDragging={dragState.draggedId === item.id}
              isDropTarget={dragState.dropTargetId === item.id}
              dropPosition={dragState.dropTargetId === item.id ? dragState.dropPosition : null}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          )}
        />
      </TreeContainer>

      <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
        <strong>How to use:</strong>
        <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
          <li>Drag any item to reorder the tree</li>
          <li>Drop on the top quarter of an item to place before</li>
          <li>Drop on the bottom quarter to place after</li>
          <li>Drop on the middle of a folder to place inside</li>
          <li>Files only support before/after positioning</li>
          <li>You cannot drop an item on its own descendants</li>
        </ul>
      </div>
    </div>
  );
};
