import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { Tree, useTreeState, flattenTree, type BasicTreeItem, type TreeData, type TreeRef } from '../HeadlessTree';

const meta: Meta<typeof Tree> = {
  title: 'HeadlessTree / Examples',
  component: Tree,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

// Define your custom data type
interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
}

// Create tree data with your custom type
const fileTreeData: TreeData<BasicTreeItem<FileItem>> = {
  rootIds: ['1', '2'],
  items: {
    '1': {
      id: '1',
      children: ['1-1', '1-2'],
      customData: { name: 'src', type: 'folder' },
    },
    '2': {
      id: '2',
      children: [],
      customData: { name: 'package.json', type: 'file', size: 1234 },
    },
    '1-1': {
      id: '1-1',
      children: [],
      customData: { name: 'index.ts', type: 'file', size: 567 },
    },
    '1-2': {
      id: '1-2',
      children: [],
      customData: { name: 'utils.ts', type: 'file', size: 890 },
    },
  },
};

// 1. Basic Tree Component (from README)
function BasicFileTree() {
  return (
    <Tree
      initialTree={fileTreeData}
      renderItem={({ item, depth, toggleOpenState }) => (
        <div style={{ paddingLeft: depth * 20 }}>
          <button onClick={toggleOpenState}>{item.children.length > 0 ? (item.isOpened ? '📂' : '📁') : '📄'}</button>
          <span>{item.customData.name}</span>
          {item.customData.size && <small> ({item.customData.size} bytes)</small>}
        </div>
      )}
    />
  );
}

export const BasicTreeExample: Story = {
  render: () => <BasicFileTree />,
};

// 2. Using useTreeState Hook (from README)
function ControlledTree() {
  const { tree, openAll, closeAll, toggleOpen } = useTreeState({
    initialTree: fileTreeData,
  });

  const flattenedTree = flattenTree(tree);

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={openAll} style={{ marginRight: '8px' }}>
          Expand All
        </button>
        <button onClick={closeAll}>Collapse All</button>
      </div>
      <div>
        {flattenedTree.map((flatItem) => (
          <div key={flatItem.item.id} style={{ paddingLeft: flatItem.depth * 20 }}>
            <button onClick={() => toggleOpen(flatItem.item.id)}>
              {flatItem.item.children.length > 0 ? (flatItem.item.isOpened ? '▼' : '▶') : '•'}
            </button>
            {flatItem.item.customData.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export const UseTreeStateExample: Story = {
  render: () => <ControlledTree />,
};

// 3. Using flattenTree (from README)
function CustomFlatTree() {
  const { tree, toggleOpen } = useTreeState({ initialTree: fileTreeData });
  const flattenedTree = flattenTree(tree);

  return (
    <div>
      {flattenedTree.map((flatItem) => (
        <div
          key={flatItem.item.id}
          style={{
            paddingLeft: flatItem.depth * 20,
            borderLeft: flatItem.isLastTreeInSameDepth ? 'none' : '1px solid #ccc',
          }}
        >
          <button onClick={() => toggleOpen(flatItem.item.id)}>
            {flatItem.item.children.length > 0 ? (flatItem.item.isOpened ? '▼' : '▶') : '•'}
          </button>
          {flatItem.item.customData.name}
        </div>
      ))}
    </div>
  );
}

export const FlattenTreeExample: Story = {
  render: () => <CustomFlatTree />,
};

// 4. Tree with useImperativeHandle
function TreeWithControls() {
  const treeRef = useRef<TreeRef<BasicTreeItem<FileItem>>>(null);

  const expandAll = () => {
    treeRef.current?.openAll();
  };

  const collapseAll = () => {
    treeRef.current?.closeAll();
  };

  const toggleNode = (nodeId: string) => {
    treeRef.current?.toggleOpen(nodeId);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={expandAll} style={{ marginRight: '8px' }}>
          Expand All
        </button>
        <button onClick={collapseAll} style={{ marginRight: '8px' }}>
          Collapse All
        </button>
        <button onClick={() => toggleNode('1')}>Toggle src folder</button>
      </div>
      <Tree
        ref={treeRef}
        initialTree={fileTreeData}
        renderItem={({ item, toggleOpenState }) => (
          <div>
            <button onClick={toggleOpenState}>{item.children.length > 0 ? (item.isOpened ? '▼' : '▶') : '•'}</button>
            {item.customData.name}
          </div>
        )}
      />
    </div>
  );
}

export const TreeWithRefExample: Story = {
  render: () => <TreeWithControls />,
};
