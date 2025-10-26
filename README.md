# headless-tree

A flexible, headless React tree component library that provides powerful tree state management with render props pattern.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![npm version](https://img.shields.io/npm/v/@kryoonminsang/headless-tree.svg)](https://www.npmjs.com/package/@kryoonminsang/headless-tree)
[![npm downloads](https://img.shields.io/npm/dm/@kryoonminsang/headless-tree.svg)](https://www.npmjs.com/package/@kryoonminsang/headless-tree)

## Features

- 🎯 **Headless Design** - Complete control over rendering and styling
- 🔧 **Flexible API** - Use `Tree`, `VirtualizedTree` components or build custom solutions with `useTreeState`, `flattenTree`
- 📦 **TypeScript Support** - Fully typed for better developer experience
- 🚀 **Performance** - Efficient tree flattening and state management
- ⚡ **Virtualization** - Handle massive datasets (300,000+ items) with smooth scrolling performance
- 🎨 **Render Props** - Flexible rendering with full access to tree state
- 🌳 **Deep Nesting** - Support for deeply nested tree structures (10+ levels)
- ✏️ **Tree Manipulation** - Insert, remove, and move tree items dynamically with built-in validation

## Installation

```bash
npm install @kryoonminsang/headless-tree
```

```bash
yarn add @kryoonminsang/headless-tree
```

```bash
pnpm add @kryoonminsang/headless-tree
```

## Quick Start

### Basic Tree

```tsx
import { Tree } from '@kryoonminsang/headless-tree';

<Tree
  initialTree={treeData}
  renderItem={({ item, depth, toggleOpenState }) => (
    <div style={{ paddingLeft: depth * 20 }}>
      <button onClick={toggleOpenState}>{item.isOpened ? '📂' : '📁'}</button>
      {item.customData.name}
    </div>
  )}
/>;
```

### Virtualized Tree (for large datasets)

```tsx
import { VirtualizedTree } from '@kryoonminsang/headless-tree';

<VirtualizedTree
  initialTree={largeTreeData}
  height="400px"
  estimateSize={() => 32}
  renderItem={({ item, depth, toggleOpenState }) => (
    <div style={{ paddingLeft: depth * 16, height: 32 }}>
      <button onClick={toggleOpenState}>{item.isOpened ? '📂' : '📁'}</button>
      {item.customData.name}
    </div>
  )}
/>;
```

### With Controls

```tsx
import { useRef } from 'react';
import { Tree, TreeRef } from '@kryoonminsang/headless-tree';

function ControlledTree() {
  const treeRef = useRef<TreeRef>(null);

  return (
    <>
      <button onClick={() => treeRef.current?.openAll()}>
        Expand All
      </button>
      <Tree ref={treeRef} initialTree={treeData} renderItem={...} />
    </>
  );
}
```

### With Tree Manipulation

```tsx
import { useRef } from 'react';
import { Tree, TreeRef } from '@kryoonminsang/headless-tree';

function EditableTree() {
  const treeRef = useRef<TreeRef>(null);

  const handleAddItem = () => {
    const newItem = {
      id: 'new-id',
      children: [],
      customData: { name: 'New Item', type: 'file' },
    };
    // Insert at the end of root level
    treeRef.current?.insertItem(null, newItem, 'last');
  };

  const handleRemoveItem = (itemId: string) => {
    treeRef.current?.removeItem(itemId);
  };

  const handleMoveItem = (sourceId: string, targetParentId: string | null) => {
    treeRef.current?.moveItem(sourceId, {
      parentId: targetParentId,
      position: 'last',
    });
  };

  return (
    <>
      <button onClick={handleAddItem}>Add Item</button>
      <Tree
        ref={treeRef}
        initialTree={treeData}
        renderItem={({ item }) => (
          <div>
            {item.customData.name}
            <button onClick={() => handleRemoveItem(item.id)}>Delete</button>
          </div>
        )}
      />
    </>
  );
}
```

## Data Structure

```tsx
interface FileItem {
  name: string;
  type: 'file' | 'folder';
}

const treeData = {
  rootIds: ['1', '2'],
  items: {
    '1': {
      id: '1',
      children: ['1-1'],
      customData: { name: 'src', type: 'folder' },
    },
    '1-1': {
      id: '1-1',
      children: [],
      customData: { name: 'index.ts', type: 'file' },
    },
    '2': {
      id: '2',
      children: [],
      customData: { name: 'package.json', type: 'file' },
    },
  },
};
```

## API Reference

### Components

#### Tree

Basic tree component for standard use cases.

```tsx
<Tree
  initialTree={treeData}
  options={{ syncWithInitialTree?: boolean }}
  renderItem={(params: RenderItemParams) => ReactNode}
/>
```

#### VirtualizedTree

Virtualized tree component for large datasets.

```tsx
<VirtualizedTree
  initialTree={treeData}
  height={number | string}
  estimateSize={(index: number) => number}
  overscan={number}
  options={{ syncWithInitialTree?: boolean }}
  renderItem={(params: RenderItemParams) => ReactNode}
  // ... any div props (className, style, etc.)
/>
```

**Props:**

- `height` - Height of the virtualized container
- `estimateSize` - Function returning estimated height of each item
- `overscan` - Number of items to render outside visible area (default: 5)
- All standard HTML div props are supported

### Hooks

#### useTreeState

```tsx
const {
  tree,
  parentMap,
  childrenIndexMap,
  open,
  close,
  toggleOpen,
  openAll,
  closeAll,
  insertItem,
  removeItem,
  moveItem,
} = useTreeState({ initialTree, options });
```

**State Management:**

- `tree` - Current tree data with merged open/close state
- `parentMap` - Map for O(1) parent lookup performance
- `childrenIndexMap` - Map for tracking child positions

**Open/Close Operations:**

- `open(id)` - Open a specific tree item
- `close(id)` - Close a specific tree item
- `toggleOpen(id)` - Toggle open/close state of an item
- `openAll()` - Expand all tree items
- `closeAll()` - Collapse all tree items

**Tree Manipulation:**

- `insertItem(parentId, newItem, position)` - Insert a new item into the tree
- `removeItem(itemId)` - Remove an item and all its descendants
- `moveItem(sourceId, target)` - Move an item to a new position

### Utilities

#### flattenTree

```tsx
const flattenedItems = flattenTree(tree);
// Returns: Array<{ item, depth, parentId, isLastTreeInSameDepth, completeDepthHashTable }>
```

Flattens the tree structure into a linear array for rendering.

#### canMoveItem

```tsx
const isValid = canMoveItem(tree, sourceId, targetId);
```

Validates whether a tree item can be moved to a target position. Returns `false` if:

- Source and target are the same item
- Target is a descendant of source (prevents circular references)

#### getAllDescendantIds

```tsx
const descendantIds = getAllDescendantIds(tree, itemId);
```

Returns an array of all descendant IDs for a given item.

#### getPath

```tsx
const path = getPath(tree, itemId);
```

Returns the path from root to the specified item as an array of IDs.

### Refs

#### TreeRef

```tsx
const treeRef = useRef<TreeRef<YourDataType>>(null);
```

Provides access to:

- `tree` - Current tree data
- `parentMap` - Parent lookup map
- `childrenIndexMap` - Children index map
- `open(id)` - Open an item
- `close(id)` - Close an item
- `toggleOpen(id)` - Toggle an item's state
- `openAll()` - Expand all items
- `closeAll()` - Collapse all items
- `insertItem(parentId, newItem, position)` - Insert a new item
- `removeItem(itemId)` - Remove an item
- `moveItem(sourceId, target)` - Move an item

#### VirtualizedTreeRef

```tsx
const treeRef = useRef<VirtualizedTreeRef<YourDataType>>(null);
```

Includes all TreeRef methods plus:

- `virtualizer` - Access to the underlying virtualizer instance

## Advanced Usage

### Insert Operations

The `insertItem` function supports multiple position types:

```tsx
// Insert at specific index (0-based)
insertItem(parentId, newItem, 0); // Insert as first child
insertItem(parentId, newItem, 2); // Insert at index 2

// Insert at predefined positions
insertItem(parentId, newItem, 'first'); // Insert at the beginning
insertItem(parentId, newItem, 'last'); // Insert at the end

// Insert relative to existing items
insertItem(parentId, newItem, { before: 'item-id' }); // Insert before an item
insertItem(parentId, newItem, { after: 'item-id' }); // Insert after an item

// Insert at root level (parentId = null)
insertItem(null, newItem, 'last'); // Add to root level
```

### Move Operations

The `moveItem` function allows repositioning items within the tree:

```tsx
// Move to specific index
moveItem(sourceId, { parentId: 'target-parent', index: 0 });

// Move to first or last position
moveItem(sourceId, { parentId: 'target-parent', position: 'first' });
moveItem(sourceId, { parentId: 'target-parent', position: 'last' });

// Move to root level
moveItem(sourceId, { parentId: null, position: 'last' });
```

**Validation:** Always validate moves using `canMoveItem` to prevent circular references:

```tsx
import { canMoveItem } from '@kryoonminsang/headless-tree';

if (canMoveItem(tree, sourceId, targetId)) {
  moveItem(sourceId, { parentId: targetId, position: 'last' });
} else {
  console.error('Cannot move item to its own descendant');
}
```

### Remove Operations

The `removeItem` function removes an item and all its descendants:

```tsx
// Removes the item and all children recursively
removeItem('item-id');
```

## TypeScript Support

This library is fully typed with TypeScript. All types are exported and can be imported:

```tsx
import type {
  TreeData,
  BasicTreeItem,
  RenderItemParams,
  TreeItemId,
  TreeRef,
  VirtualizedTreeProps,
  VirtualizedTreeRef,
  ParentMap,
  ChildrenIndexMap,
} from '@kryoonminsang/headless-tree';
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Run linter
pnpm lint

# Build library
pnpm build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Issues

If you encounter any issues or have feature requests, please create an issue on [GitHub Issues](https://github.com/yoonminsang/headless-tree/issues).
