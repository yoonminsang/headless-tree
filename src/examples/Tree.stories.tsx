import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { Tree, type BasicTreeItem, type TreeData, type TreeRef } from '../HeadlessTree';
import { Button, ControlsPanel, TreeContainer, TreeItemRenderer, type FileItem } from './ui';

const createTree = (): TreeData<BasicTreeItem<FileItem>> => ({
  rootIds: ['1', '2', '3'],
  items: {
    '1': {
      id: '1',
      children: ['1-1', '1-2', '1-3'],
      customData: { name: 'src', type: 'folder' },
    },
    '2': {
      id: '2',
      children: ['2-1', '2-2'],
      customData: { name: 'docs', type: 'folder' },
    },
    '3': {
      id: '3',
      children: [],
      customData: { name: 'package.json', type: 'file' as const, size: 1234 },
    },
    '1-1': {
      id: '1-1',
      children: [],
      customData: { name: 'index.ts', type: 'file' as const, size: 567 },
    },
    '1-2': {
      id: '1-2',
      children: ['1-2-1'],
      customData: { name: 'components', type: 'folder' },
    },
    '1-3': {
      id: '1-3',
      children: [],
      customData: { name: 'utils.ts', type: 'file' as const, size: 890 },
    },
    '1-2-1': {
      id: '1-2-1',
      children: [],
      customData: { name: 'Button.tsx', type: 'file' as const, size: 2341 },
    },
    '2-1': {
      id: '2-1',
      children: [],
      customData: { name: 'README.md', type: 'file' as const, size: 1500 },
    },
    '2-2': {
      id: '2-2',
      children: [],
      customData: { name: 'API.md', type: 'file' as const, size: 3200 },
    },
  },
});

function TreeComponent() {
  const treeData = createTree();
  const treeRef = useRef<TreeRef<BasicTreeItem<FileItem>>>(null);

  const handleExpandAll = () => {
    treeRef.current?.openAll();
  };

  const handleCollapseAll = () => {
    treeRef.current?.closeAll();
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
        <Button onClick={handleExpandAll}>Expand All</Button>
        <Button onClick={handleCollapseAll} variant="secondary">
          Collapse All
        </Button>
        <span
          style={{
            color: '#666',
            fontSize: '13px',
            fontWeight: 'normal',
          }}
        >
          Basic tree with programmatic controls
        </span>
      </ControlsPanel>

      <TreeContainer>
        <Tree
          ref={treeRef}
          initialTree={treeData}
          renderItem={({ item, depth, toggleOpenState }) => (
            <TreeItemRenderer
              item={item}
              depth={depth}
              toggleOpenState={toggleOpenState}
              iconType="emoji"
              showSize={true}
            />
          )}
        />
      </TreeContainer>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
        <strong>Features:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Basic tree structure with file/folder icons</li>
          <li>Programmatic control via Tree ref</li>
          <li>Expand/collapse all functionality</li>
          <li>Click to toggle individual nodes</li>
        </ul>
      </div>
    </div>
  );
}

const meta: Meta<typeof TreeComponent> = {
  title: 'Examples/Tree',
  component: TreeComponent,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
