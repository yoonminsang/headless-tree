import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
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

const meta: Meta<typeof Tree> = {
  title: 'Examples/Tree',
  component: Tree,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultTree() {
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

export const Default: Story = {
  render: () => <DefaultTree />,
};

function TreeWithInsertRemove() {
  const treeData = createTree();
  const treeRef = useRef<TreeRef<BasicTreeItem<FileItem>>>(null);
  const [counter, setCounter] = useState(1);

  const handleInsertFile = () => {
    const newId = `new-file-${counter}`;
    const newItem: BasicTreeItem<FileItem> = {
      id: newId,
      children: [],
      customData: { name: `new-file-${counter}.ts`, type: 'file', size: 100 },
    };
    treeRef.current?.insertItem('1', newItem, 'last');
    setCounter((c) => c + 1);
  };

  const handleInsertFolder = () => {
    const newId = `new-folder-${counter}`;
    const newItem: BasicTreeItem<FileItem> = {
      id: newId,
      children: [],
      customData: { name: `new-folder-${counter}`, type: 'folder' },
    };
    treeRef.current?.insertItem(null, newItem, 'last');
    setCounter((c) => c + 1);
  };

  const handleRemovePackageJson = () => {
    treeRef.current?.removeItem('3');
  };

  const handleRemoveSrc = () => {
    treeRef.current?.removeItem('1');
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
        <Button onClick={handleInsertFile}>Add File to src/</Button>
        <Button onClick={handleInsertFolder} variant="secondary">
          Add Folder to Root
        </Button>
        <Button onClick={handleRemovePackageJson} variant="secondary">
          Remove package.json
        </Button>
        <Button onClick={handleRemoveSrc} variant="secondary">
          Remove src/ (with children)
        </Button>
        <span
          style={{
            color: '#666',
            fontSize: '13px',
            fontWeight: 'normal',
          }}
        >
          Insert & Remove operations
        </span>
      </ControlsPanel>

      <TreeContainer>
        <Tree
          ref={treeRef}
          initialTree={treeData}
          options={{ syncWithInitialTree: false }}
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
          <li>Insert new items with insertItem(parentId, newItem, position)</li>
          <li>Remove items with removeItem(itemId)</li>
          <li>Removing a folder also removes all its children</li>
          <li>Items are inserted at the specified position (first/last/before/after)</li>
        </ul>
      </div>
    </div>
  );
}

export const InsertAndRemove: Story = {
  render: () => <TreeWithInsertRemove />,
};
