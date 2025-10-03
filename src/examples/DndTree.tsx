import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useRef, useState } from 'react';
import { type BasicTreeItem, Tree, type TreeData, type TreeItemId, type TreeRef } from '../HeadlessTree';
import { canDropItem } from './treeUtils';
import { Button, ControlsPanel, type FileItem, TreeContainer, TreeItemRenderer } from './ui';

interface DndTreeItemProps {
  item: BasicTreeItem<FileItem>;
  depth: number;
  toggleOpenState: () => void;
}

const DndTreeItem: React.FC<DndTreeItemProps> = ({ item, depth, toggleOpenState }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id.toString(),
    data: {
      item,
      depth,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const treeRef = useRef<TreeRef<BasicTreeItem<FileItem>>>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get all visible items in their rendered order for smooth animations
  const getVisibleItemIds = (): TreeItemId[] => {
    const tree = treeRef.current?.tree;
    if (!tree) return [];

    const visibleIds: TreeItemId[] = [];

    const traverse = (itemIds: TreeItemId[]) => {
      itemIds.forEach((id) => {
        const item = tree.items[id];
        if (item) {
          visibleIds.push(id);
          if (item.isOpened && item.children.length > 0) {
            traverse(item.children);
          }
        }
      });
    };

    traverse(tree.rootIds);
    return visibleIds;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;
      const tree = treeRef.current?.tree;

      if (tree && canDropItem(tree, activeId, overId)) {
        // Determine position based on relative positions
        const currentItems = getVisibleItemIds();
        const activeIndex = currentItems.indexOf(activeId);
        const overIndex = currentItems.indexOf(overId);

        // If dragging from above to below, use 'after'; if from below to above, use 'before'
        const position = activeIndex < overIndex ? 'after' : 'before';

        console.log('Move decision:', { activeIndex, overIndex, position });
        console.log('Using new TreeRef.moveItem API');

        // Use the new simplified API!
        treeRef.current?.moveItem(activeId, overId, position);
      }
    }

    setActiveId(null);
  };

  const resetTree = () => {
    // Tree를 초기 상태로 리셋하는 로직이 필요하다면 TreeRef에 추가 가능
    setActiveId(null);
  };

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
        <Button onClick={resetTree} variant="secondary">
          Reset Tree
        </Button>
        <span
          style={{
            color: '#666',
            fontSize: '13px',
            fontWeight: 'normal',
          }}
        >
          {activeId ? `Dragging: ${treeRef.current?.tree.items[activeId]?.customData.name}` : 'Drag items to reorder'}
        </span>
      </ControlsPanel>

      <TreeContainer>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={getVisibleItemIds()} strategy={verticalListSortingStrategy}>
            <Tree
              ref={treeRef}
              initialTree={initialTree}
              options={{ syncWithInitialTree: false }}
              renderItem={({ item, depth, toggleOpenState }) => (
                <DndTreeItem key={item.id} item={item} depth={depth} toggleOpenState={toggleOpenState} />
              )}
            />
          </SortableContext>

          <DragOverlay>
            {activeId && treeRef.current?.tree.items[activeId] ? (
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transform: 'rotate(5deg)',
                }}
              >
                <TreeItemRenderer
                  item={treeRef.current.tree.items[activeId]}
                  depth={0}
                  toggleOpenState={() => {}}
                  showSize={true}
                  iconType="emoji"
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </TreeContainer>

      <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
        <strong>How to use:</strong>
        <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
          <li>Drag any item to reorder the tree</li>
          <li>Drop on the top/bottom of an item to place before/after</li>
          <li>Drop on the middle of a folder to place inside</li>
          <li>You cannot drop an item on its own descendants</li>
        </ul>
      </div>
    </div>
  );
};
