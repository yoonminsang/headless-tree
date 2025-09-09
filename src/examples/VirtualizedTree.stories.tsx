import { useRef, useState, useCallback, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { VirtualizedTree, type VirtualizedTreeRef, type BasicTreeItem, type TreeData } from '../HeadlessTree';
import { Button, ControlsPanel, TreeContainer, TreeItemRenderer, styles, type FileItem } from './ui';

function generateLargeTreeData(): TreeData<BasicTreeItem<FileItem>> {
  const items: Record<string, BasicTreeItem<FileItem>> = {};
  const rootIds: string[] = [];

  for (let rootIndex = 1; rootIndex <= 3; rootIndex++) {
    const rootId = `root-${rootIndex}`;
    rootIds.push(rootId);

    // Create root folder
    items[rootId] = {
      id: rootId,
      children: [],
      customData: {
        name: `project-${rootIndex}`,
        type: 'folder',
      },
    };

    // Use queue for iterative depth creation
    const queue: Array<{ id: string; depth: number; parentId: string | null }> = [
      { id: rootId, depth: 0, parentId: null },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const { id, depth } = current;

      if (depth >= 10) {
        // At max depth (10), create files
        const children: string[] = [];
        for (let f = 1; f <= 30; f++) {
          const fileId = `${id}-file-${f}`;
          children.push(fileId);
          items[fileId] = {
            id: fileId,
            children: [],
            customData: {
              name: `file-${f}.${['ts', 'tsx', 'js', 'jsx', 'css', 'json', 'md'][f % 7]}`,
              type: 'file',
              size: Math.floor(Math.random() * 50000) + 100,
            },
          };
        }
        items[id].children = children;
      } else if (depth < 10) {
        // Create folders at this depth
        const children: string[] = [];
        const foldersCount = depth <= 2 ? 3 : 2; // Simple growth pattern

        for (let d = 1; d <= foldersCount; d++) {
          const folderId = `${id}-d${depth + 1}-${d}`;
          children.push(folderId);

          items[folderId] = {
            id: folderId,
            children: [],
            customData: {
              name: `level${depth + 1}-folder${d}`,
              type: 'folder',
            },
          };

          // Add to queue for next iteration
          queue.push({ id: folderId, depth: depth + 1, parentId: id });
        }

        items[id].children = children;
      }
    }
  }

  return { rootIds, items };
}

// Generate data once to avoid recreation on every render
const largeTreeData = generateLargeTreeData();

function VirtualizedTreeExample() {
  const treeRef = useRef<VirtualizedTreeRef<BasicTreeItem<FileItem>>>(null);
  const [stats, setStats] = useState({ visible: 0, total: 0, expanded: false });

  const updateStats = useCallback(() => {
    if (treeRef.current) {
      const virtualItems = treeRef.current.virtualizer.getVirtualItems().length;
      setStats({
        visible: virtualItems,
        total: Object.keys(largeTreeData.items).length,
        expanded: virtualItems > 2000, // Rough estimate if expanded
      });
    }
  }, []);

  const handleExpandAll = () => {
    treeRef.current?.openAll();
    setTimeout(updateStats, 100);
  };

  const handleCollapseAll = () => {
    treeRef.current?.closeAll();
    setTimeout(updateStats, 100);
  };

  const handleScrollToTop = () => {
    treeRef.current?.virtualizer.scrollToIndex(0);
  };

  const handleScrollToMiddle = () => {
    const middleIndex = Math.floor(treeRef.current?.virtualizer.getVirtualItems().length || 0 / 2);
    treeRef.current?.virtualizer.scrollToIndex(middleIndex);
  };

  useEffect(() => {
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [updateStats]);

  return (
    <div style={styles.container}>
      <ControlsPanel>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={handleExpandAll}>Expand All</Button>
          <Button onClick={handleCollapseAll} variant="secondary">
            Collapse All
          </Button>

          <div style={{ height: '20px', width: '1px', backgroundColor: '#ddd', margin: '0 8px' }} />

          <Button onClick={handleScrollToTop}>Scroll to Top</Button>
          <Button onClick={handleScrollToMiddle}>Scroll to Middle</Button>
        </div>

        <div style={{ ...styles.stats, marginTop: '8px', fontSize: '13px' }}>
          <strong>Performance Stats:</strong> {stats.visible.toLocaleString()} visible items •{' '}
          {stats.total.toLocaleString()} total items • 10 levels deep
          {stats.expanded && <span style={{ color: '#e74c3c' }}> • High memory usage (all expanded)</span>}
        </div>
      </ControlsPanel>

      <TreeContainer>
        <VirtualizedTree
          ref={treeRef}
          initialTree={largeTreeData}
          height="500px"
          estimateSize={() => 32}
          overscan={10}
          renderItem={({ item, depth, toggleOpenState }) => (
            <div
              style={{
                backgroundColor: depth % 2 === 0 ? '#ffffff' : '#fafbfc',
              }}
            >
              <TreeItemRenderer
                item={item}
                depth={depth}
                toggleOpenState={toggleOpenState}
                iconType="emoji"
                showSize={true}
              />
            </div>
          )}
        />
      </TreeContainer>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
        <strong>Virtualization Benefits:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Only renders visible items (~15-20 DOM nodes instead of 300,000+)</li>
          <li>Smooth scrolling performance regardless of data size</li>
          <li>Constant memory usage even with large datasets</li>
          <li>Deep nesting (10 levels) handled efficiently</li>
          <li>Programmatic scroll control via virtualizer</li>
        </ul>
      </div>
    </div>
  );
}

const meta: Meta<typeof VirtualizedTreeExample> = {
  title: 'Examples/VirtualizedTree',
  component: VirtualizedTreeExample,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
