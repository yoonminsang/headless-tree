# headless-tree

A flexible, headless React tree component library that provides powerful tree state management with render props pattern.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![npm version](https://badge.fury.io/js/headless-tree.svg)](https://badge.fury.io/js/headless-tree)

## Features

- 🎯 **Headless Design** - Complete control over rendering and styling
- 🔧 **Flexible API** - Use `Tree`, `VirtualizedTree` components or build custom solutions with `useTreeState`, `flattenTree`
- 📦 **TypeScript Support** - Fully typed for better developer experience
- 🚀 **Performance** - Efficient tree flattening and state management
- ⚡ **Virtualization** - Handle massive datasets (300,000+ items) with smooth scrolling performance
- 🎨 **Render Props** - Flexible rendering with full access to tree state
- 🌳 **Deep Nesting** - Support for deeply nested tree structures (10+ levels)

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
const { tree, open, close, toggleOpen, openAll, closeAll } = useTreeState({ initialTree, options });
```

### Utilities

#### flattenTree

```tsx
const flattenedItems = flattenTree(tree);
// Returns: Array<{ item, depth, parentId, isLastTreeInSameDepth, completeDepthHashTable }>
```

### Refs

#### TreeRef

```tsx
const treeRef = useRef<TreeRef<YourDataType>>(null);
// Access: tree, open, close, toggleOpen, openAll, closeAll
```

#### VirtualizedTreeRef

```tsx
const treeRef = useRef<VirtualizedTreeRef<YourDataType>>(null);
// Access: tree, open, close, toggleOpen, openAll, closeAll, virtualizer
```

## TypeScript Support

This library is fully typed with TypeScript. All types are exported and can be imported:

```tsx
import type {
  TreeData,
  BasicTreeItem,
  RenderItemParams,
  TreeItemId,
  VirtualizedTreeProps,
  VirtualizedTreeRef,
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
