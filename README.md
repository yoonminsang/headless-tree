# headless-tree

A flexible, headless React tree component library that provides powerful tree state management with render props pattern.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![npm version](https://badge.fury.io/js/headless-tree.svg)](https://badge.fury.io/js/headless-tree)

## Features

- 🎯 **Headless Design** - Complete control over rendering and styling
- 🔧 **Flexible API** - Use the `Tree` component or build custom solutions with `useTreeState`, `flattenTree`
- 📦 **TypeScript Support** - Fully typed for better developer experience
- 🚀 **Performance** - Efficient tree flattening and state management
- 🎨 **Render Props** - Flexible rendering with full access to tree state

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

## Usage

### 1. Basic Tree Component

The simplest way to use headless-tree with custom data types:

```tsx
import { Tree, TreeData, BasicTreeItem } from '@kryoonminsang/headless-tree';

// Define your custom data type
interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
}

// Create tree data with your custom type
const treeData: TreeData<BasicTreeItem<FileItem>> = {
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

function FileTree() {
  return (
    <Tree
      initialTree={treeData}
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
```

### 2. Using useTreeState Hook

When you need more control over tree state:

```tsx
import { useTreeState, Tree } from '@kryoonminsang/headless-tree';

function ControlledTree() {
  const { tree, open, close, toggleOpen, openAll, closeAll } = useTreeState({
    initialTree: treeData,
  });

  return (
    <div>
      <div>
        <button onClick={openAll}>Expand All</button>
        <button onClick={closeAll}>Collapse All</button>
      </div>
      {/* customize here */}
    </div>
  );
}
```

### 3. Using flattenTree

For maximum control with direct tree manipulation:

```tsx
import { flattenTree, useTreeState } from '@kryoonminsang/headless-tree';

function CustomFlatTree() {
  const { tree, toggleOpen } = useTreeState({ initialTree: treeData });
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
```

## TypeScript Support

This library is fully typed with TypeScript. All types are exported and can be imported:

```tsx
import type { TreeData, BasicTreeItem, RenderItemParams, TreeItemId } from '@kryoonminsang/headless-tree';
```

For detailed type definitions, please refer to the source code or your IDE's IntelliSense.

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
