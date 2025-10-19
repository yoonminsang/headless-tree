import type { Meta, StoryObj } from '@storybook/react-vite';
import { DndTree } from './DndTree';
import type { BasicTreeItem, TreeData } from '../HeadlessTree';
import type { FileItem } from './ui';

const createTree = (): TreeData<BasicTreeItem<FileItem>> => ({
  rootIds: ['1', '2', '3'],
  items: {
    '1': {
      id: '1',
      children: ['1-1', '1-2', '1-3'],
      customData: { name: 'Documents', type: 'folder' },
    },
    '1-1': {
      id: '1-1',
      children: ['1-1-1'],
      customData: { name: 'Projects', type: 'folder' },
    },
    '1-1-1': {
      id: '1-1-1',
      children: [],
      customData: { name: 'README.md', type: 'file', size: 1024 },
    },
    '1-2': {
      id: '1-2',
      children: [],
      customData: { name: 'report.pdf', type: 'file', size: 5120 },
    },
    '1-3': {
      id: '1-3',
      children: [],
      customData: { name: 'notes.txt', type: 'file', size: 256 },
    },
    '2': {
      id: '2',
      children: ['2-1', '2-2'],
      customData: { name: 'Images', type: 'folder' },
    },
    '2-1': {
      id: '2-1',
      children: [],
      customData: { name: 'photo1.jpg', type: 'file', size: 2048 },
    },
    '2-2': {
      id: '2-2',
      children: [],
      customData: { name: 'photo2.png', type: 'file', size: 3072 },
    },
    '3': {
      id: '3',
      children: [],
      customData: { name: 'config.json', type: 'file', size: 512 },
    },
  },
});

const meta: Meta<typeof DndTree> = {
  title: 'Examples/DndTree',
  component: DndTree,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A drag and drop tree example built on top of the headless Tree component.

This example demonstrates how to extend the basic Tree component with drag and drop functionality using the HTML5 drag and drop API and tree manipulation utilities.

### Features:
- **Drag and Drop**: Move items by dragging them to different positions
- **Visual Feedback**: Shows drop zones and drag states with visual indicators
- **Smart Drop Detection**: Prevents dropping items on their own descendants
- **Multiple Drop Positions**: Drop before, after, or inside (for folders) other items
- **Tree State Management**: Maintains expand/collapse state during operations

### Key Implementation Points:
- Uses \`moveTreeItem\` utility for tree structure updates
- Implements \`canDropItem\` validation to prevent invalid drops
- Leverages \`syncWithInitialTree\` option for real-time updates
- Provides visual feedback through CSS styling
        `,
      },
    },
  },
  argTypes: {
    initialTree: {
      description: 'Initial tree data structure',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialTree: createTree(),
  },
  parameters: {
    docs: {
      description: {
        story: 'A typical file system tree structure demonstrating drag and drop functionality with folders and files.',
      },
    },
  },
};

export const DeepNesting: Story = {
  args: {
    initialTree: {
      rootIds: ['root-1', 'root-2'],
      items: {
        'root-1': {
          id: 'root-1',
          children: ['1-1', '1-2'],
          customData: { name: 'src', type: 'folder' },
        },
        '1-1': {
          id: '1-1',
          children: ['1-1-1', '1-1-2'],
          customData: { name: 'components', type: 'folder' },
        },
        '1-1-1': {
          id: '1-1-1',
          children: ['1-1-1-1', '1-1-1-2'],
          customData: { name: 'ui', type: 'folder' },
        },
        '1-1-1-1': {
          id: '1-1-1-1',
          children: [],
          customData: { name: 'Button.tsx', type: 'file', size: 2048 },
        },
        '1-1-1-2': {
          id: '1-1-1-2',
          children: [],
          customData: { name: 'Input.tsx', type: 'file', size: 1536 },
        },
        '1-1-2': {
          id: '1-1-2',
          children: [],
          customData: { name: 'Tree.tsx', type: 'file', size: 4096 },
        },
        '1-2': {
          id: '1-2',
          children: ['1-2-1'],
          customData: { name: 'utils', type: 'folder' },
        },
        '1-2-1': {
          id: '1-2-1',
          children: [],
          customData: { name: 'helpers.ts', type: 'file', size: 1024 },
        },
        'root-2': {
          id: 'root-2',
          children: ['2-1'],
          customData: { name: 'tests', type: 'folder' },
        },
        '2-1': {
          id: '2-1',
          children: [],
          customData: { name: 'tree.test.ts', type: 'file', size: 3072 },
        },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A deeply nested tree structure to test drag and drop with multiple nesting levels and complex hierarchies.',
      },
    },
  },
};
