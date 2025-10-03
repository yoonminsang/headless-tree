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
};

export const LargeTree: Story = {
  args: {
    initialTree: (() => {
      const largeTree: TreeData<BasicTreeItem<FileItem>> = {
        rootIds: [],
        items: {},
      };

      // Generate a larger tree structure
      for (let i = 1; i <= 5; i++) {
        const folderId = `folder-${i}`;
        largeTree.rootIds.push(folderId);
        largeTree.items[folderId] = {
          id: folderId,
          children: [],
          customData: { name: `Folder ${i}`, type: 'folder' },
        };

        // Add subfolders and files
        for (let j = 1; j <= 3; j++) {
          const subFolderId = `${folderId}-sub-${j}`;
          largeTree.items[folderId].children.push(subFolderId);
          largeTree.items[subFolderId] = {
            id: subFolderId,
            children: [],
            customData: { name: `Subfolder ${i}-${j}`, type: 'folder' },
          };

          // Add files to subfolders
          for (let k = 1; k <= 4; k++) {
            const fileId = `${subFolderId}-file-${k}`;
            largeTree.items[subFolderId].children.push(fileId);
            largeTree.items[fileId] = {
              id: fileId,
              children: [],
              customData: {
                name: `file-${i}-${j}-${k}.txt`,
                type: 'file',
                size: Math.floor(Math.random() * 10000) + 100,
              },
            };
          }
        }

        // Add some root level files
        for (let j = 1; j <= 2; j++) {
          const fileId = `root-file-${i}-${j}`;
          largeTree.rootIds.push(fileId);
          largeTree.items[fileId] = {
            id: fileId,
            children: [],
            customData: {
              name: `root-file-${i}-${j}.md`,
              type: 'file',
              size: Math.floor(Math.random() * 5000) + 200,
            },
          };
        }
      }

      return largeTree;
    })(),
  },
  parameters: {
    docs: {
      description: {
        story: 'A larger tree structure with multiple levels and more items to demonstrate drag and drop performance.',
      },
    },
  },
};

export const SimpleStructure: Story = {
  args: {
    initialTree: {
      rootIds: ['a', 'b', 'c'],
      items: {
        a: {
          id: 'a',
          children: ['a1'],
          customData: { name: 'Folder A', type: 'folder' },
        },
        a1: {
          id: 'a1',
          children: [],
          customData: { name: 'File A1.txt', type: 'file', size: 100 },
        },
        b: {
          id: 'b',
          children: [],
          customData: { name: 'File B.md', type: 'file', size: 200 },
        },
        c: {
          id: 'c',
          children: [],
          customData: { name: 'File C.json', type: 'file', size: 150 },
        },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A minimal tree structure for testing basic drag and drop functionality.',
      },
    },
  },
};
