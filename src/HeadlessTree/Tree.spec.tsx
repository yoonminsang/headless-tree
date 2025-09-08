import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createRef, type JSX } from 'react';
import { Tree, type TreeRef } from './Tree';
import type { BasicTreeItem, TreeData, RenderItemParams } from './types';
import * as logModule from '../internal/logError';

/**
 * Basic test tree structure:
 *
 * 1 (closed)
 * ├── 2 (opened)
 * │   ├── 4 (closed)
 * │   └── 5 (closed)
 * └── 3 (closed)
 *     └── 6 (opened)
 *         └── 7 (closed)
 */
const createBasicTree = (): TreeData<BasicTreeItem> => ({
  rootIds: ['1'],
  items: {
    '1': { id: '1', children: ['2', '3'], isOpened: false, customData: {} },
    '2': { id: '2', children: ['4', '5'], isOpened: true, customData: {} },
    '3': { id: '3', children: ['6'], isOpened: false, customData: {} },
    '4': { id: '4', children: [], isOpened: false, customData: {} },
    '5': { id: '5', children: [], isOpened: false, customData: {} },
    '6': { id: '6', children: ['7'], isOpened: true, customData: {} },
    '7': { id: '7', children: [], isOpened: false, customData: {} },
  },
});

/**
 * Multi-root tree structure:
 *
 * root1 (opened)
 * ├── a (opened)
 * └── b (closed)
 * root2 (opened)
 * └── c (closed)
 */
const createMultiRootTree = (): TreeData<BasicTreeItem> => ({
  rootIds: ['root1', 'root2'],
  items: {
    root1: { id: 'root1', children: ['a', 'b'], isOpened: true, customData: {} },
    root2: { id: 'root2', children: ['c'], isOpened: true, customData: {} },
    a: { id: 'a', children: [], isOpened: true, customData: {} },
    b: { id: 'b', children: [], isOpened: false, customData: {} },
    c: { id: 'c', children: [], isOpened: false, customData: {} },
  },
});

// Default render item function for testing
const createDefaultRenderItem = () =>
  vi.fn(({ item, depth, open, close, toggleOpenState }: RenderItemParams<BasicTreeItem>) => (
    <div
      data-testid={`tree-item-${item.id}`}
      data-depth={depth}
      data-opened={item.isOpened}
      data-has-children={item.children.length > 0}
    >
      <span>{String(item.id)}</span>
      <button data-testid={`open-${item.id}`} onClick={open}>
        Open
      </button>
      <button data-testid={`close-${item.id}`} onClick={close}>
        Close
      </button>
      <button data-testid={`toggle-${item.id}`} onClick={toggleOpenState}>
        Toggle
      </button>
    </div>
  ));

describe('Tree', () => {
  let logErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logErrorSpy = vi.spyOn(logModule, 'logError').mockImplementation(() => {});
  });

  afterEach(() => {
    logErrorSpy.mockRestore();
  });

  describe('Core functionality', () => {
    it('should render tree items correctly', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      // Only root node should be visible initially (since it's closed)
      expect(screen.getByTestId('tree-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tree-item-3')).not.toBeInTheDocument();
    });

    it('should render flattened tree structure based on open/closed state', () => {
      const tree: TreeData<BasicTreeItem> = {
        rootIds: ['1'],
        items: {
          '1': { id: '1', children: ['2'], isOpened: true, customData: {} },
          '2': { id: '2', children: ['3'], isOpened: false, customData: {} },
          '3': { id: '3', children: [], isOpened: false, customData: {} },
        },
      };
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      // Root and first level should be visible
      expect(screen.getByTestId('tree-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('tree-item-2')).toBeInTheDocument();
      // Third level should not be visible (parent is closed)
      expect(screen.queryByTestId('tree-item-3')).not.toBeInTheDocument();
    });

    it('should pass correct props to renderItem function', () => {
      const tree: TreeData<BasicTreeItem> = {
        rootIds: ['1'],
        items: {
          '1': { id: '1', children: ['2'], isOpened: true, customData: {} },
          '2': { id: '2', children: [], isOpened: false, customData: {} },
        },
      };
      const renderItem = vi.fn(() => <div>test</div>);

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      expect(renderItem).toHaveBeenCalledTimes(2);

      // Check root item props
      expect(renderItem).toHaveBeenNthCalledWith(1, {
        item: expect.objectContaining({ id: '1' }),
        depth: 0,
        parentId: null,
        isLastTreeInSameDepth: true,
        completeDepthHashTable: {},
        open: expect.any(Function),
        close: expect.any(Function),
        toggleOpenState: expect.any(Function),
      });

      // Check child item props
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childCall = (renderItem.mock.calls as any[]).find((call) => call[0].item.id === '2');
      expect(childCall).toBeDefined();
      expect(childCall![0]).toEqual(
        expect.objectContaining({
          item: expect.objectContaining({ id: '2' }),
          depth: 1,
          parentId: '1',
          isLastTreeInSameDepth: true,
          open: expect.any(Function),
          close: expect.any(Function),
          toggleOpenState: expect.any(Function),
        })
      );
    });

    it('should handle empty tree', () => {
      const emptyTree: TreeData<BasicTreeItem> = { rootIds: [], items: {} };
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={emptyTree} renderItem={renderItem} />);

      expect(renderItem).not.toHaveBeenCalled();
    });
  });

  describe('User interactions', () => {
    it('should open nodes when open button is clicked', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      // Initially only root node is visible
      expect(screen.getByTestId('tree-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();

      // Click open button
      fireEvent.click(screen.getByTestId('open-1'));

      // Now children should be visible
      expect(screen.getByTestId('tree-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('tree-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('tree-item-3')).toBeInTheDocument();
    });

    it('should close nodes when close button is clicked', () => {
      const tree: TreeData<BasicTreeItem> = {
        rootIds: ['1'],
        items: {
          '1': { id: '1', children: ['2'], isOpened: true, customData: {} },
          '2': { id: '2', children: [], isOpened: false, customData: {} },
        },
      };
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      // Initially both nodes are visible
      expect(screen.getByTestId('tree-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('tree-item-2')).toBeInTheDocument();

      // Click close button
      fireEvent.click(screen.getByTestId('close-1'));

      // Now only root should be visible
      expect(screen.getByTestId('tree-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();
    });

    it('should toggle nodes when toggle button is clicked', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      // Initially only root is visible (closed)
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();

      // Toggle to open
      fireEvent.click(screen.getByTestId('toggle-1'));
      expect(screen.getByTestId('tree-item-2')).toBeInTheDocument();

      // Toggle to close
      fireEvent.click(screen.getByTestId('toggle-1'));
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();
    });

    it('should handle multiple root trees', () => {
      const tree = createMultiRootTree();
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      // All open nodes should be visible
      expect(screen.getByTestId('tree-item-root1')).toBeInTheDocument();
      expect(screen.getByTestId('tree-item-a')).toBeInTheDocument();
      expect(screen.getByTestId('tree-item-b')).toBeInTheDocument();
      expect(screen.getByTestId('tree-item-root2')).toBeInTheDocument();
      expect(screen.getByTestId('tree-item-c')).toBeInTheDocument();
    });
  });

  describe('Ref functionality', () => {
    it('should expose tree state and control methods through ref', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();
      const ref = createRef<TreeRef<BasicTreeItem>>();

      render(<Tree ref={ref} initialTree={tree} renderItem={renderItem} />);

      expect(ref.current).toBeDefined();
      expect(ref.current?.tree).toEqual(tree);
      expect(typeof ref.current?.open).toBe('function');
      expect(typeof ref.current?.close).toBe('function');
      expect(typeof ref.current?.toggleOpen).toBe('function');
      expect(typeof ref.current?.openAll).toBe('function');
      expect(typeof ref.current?.closeAll).toBe('function');
    });

    it('should allow programmatic control through ref', async () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();
      const ref = createRef<TreeRef<BasicTreeItem>>();

      render(<Tree ref={ref} initialTree={tree} renderItem={renderItem} />);

      // Initially only root is visible
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();

      // Open through ref
      await act(async () => {
        ref.current?.open('1');
      });

      // Wait for re-render and check if children are visible
      await waitFor(() => {
        expect(screen.getByTestId('tree-item-2')).toBeInTheDocument();
      });
    });

    it('should update tree state through ref methods', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();
      const ref = createRef<TreeRef<BasicTreeItem>>();

      render(<Tree ref={ref} initialTree={tree} renderItem={renderItem} />);

      // Initial state - node 1 is closed
      expect(ref.current?.tree.items['1'].isOpened).toBe(false);

      // Open node 1
      act(() => {
        ref.current?.open('1');
      });
      expect(ref.current?.tree.items['1'].isOpened).toBe(true);

      // Close node 1
      act(() => {
        ref.current?.close('1');
      });
      expect(ref.current?.tree.items['1'].isOpened).toBe(false);

      // Toggle node 1
      act(() => {
        ref.current?.toggleOpen('1');
      });
      expect(ref.current?.tree.items['1'].isOpened).toBe(true);
    });

    it('should handle openAll and closeAll through ref', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();
      const ref = createRef<TreeRef<BasicTreeItem>>();

      render(<Tree ref={ref} initialTree={tree} renderItem={renderItem} />);

      // Open all nodes
      act(() => {
        ref.current?.openAll();
      });
      Object.values(ref.current?.tree.items || {}).forEach((item) => {
        expect(item.isOpened).toBe(true);
      });

      // Close all nodes
      act(() => {
        ref.current?.closeAll();
      });
      Object.values(ref.current?.tree.items || {}).forEach((item) => {
        expect(item.isOpened).toBe(false);
      });
    });
  });

  describe('Options and configuration', () => {
    it('should handle syncWithInitialTree option', () => {
      const initialTree = createBasicTree();
      const renderItem = createDefaultRenderItem();
      const ref = createRef<TreeRef<BasicTreeItem>>();

      const { rerender } = render(
        <Tree ref={ref} initialTree={initialTree} renderItem={renderItem} options={{ syncWithInitialTree: true }} />
      );

      // Modify state
      act(() => {
        ref.current?.open('1');
      });
      expect(ref.current?.tree.items['1'].isOpened).toBe(true);

      // Create new tree with different state
      const newTree = {
        ...initialTree,
        items: {
          ...initialTree.items,
          '1': { ...initialTree.items['1'], isOpened: false },
        },
      };

      // Re-render with new tree
      rerender(
        <Tree ref={ref} initialTree={newTree} renderItem={renderItem} options={{ syncWithInitialTree: true }} />
      );

      // Should sync with new tree
      expect(ref.current?.tree.items['1'].isOpened).toBe(false);
    });

    it('should not sync with initialTree when syncWithInitialTree is false', () => {
      const initialTree = createBasicTree();
      const renderItem = createDefaultRenderItem();
      const ref = createRef<TreeRef<BasicTreeItem>>();

      const { rerender } = render(
        <Tree ref={ref} initialTree={initialTree} renderItem={renderItem} options={{ syncWithInitialTree: false }} />
      );

      // Modify state
      act(() => {
        ref.current?.open('1');
      });
      expect(ref.current?.tree.items['1'].isOpened).toBe(true);

      // Create new tree
      const newTree = {
        ...initialTree,
        items: {
          ...initialTree.items,
          '1': { ...initialTree.items['1'], isOpened: false },
        },
      };

      // Re-render with new tree
      rerender(
        <Tree ref={ref} initialTree={newTree} renderItem={renderItem} options={{ syncWithInitialTree: false }} />
      );

      // Should maintain existing state
      expect(ref.current?.tree.items['1'].isOpened).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid node operations gracefully', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();
      const ref = createRef<TreeRef<BasicTreeItem>>();

      render(<Tree ref={ref} initialTree={tree} renderItem={renderItem} />);

      // Try to operate on non-existent node - should not throw
      expect(() => {
        ref.current?.open('non-existent');
      }).not.toThrow();

      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '[useTreeState] Invalid item ID',
        }),
        expect.objectContaining({
          id: 'non-existent',
        })
      );
    });

    it('should handle malformed tree data', () => {
      const malformedTree: TreeData<BasicTreeItem> = {
        rootIds: ['1', 'missing-root'],
        items: {
          '1': { id: '1', children: ['2', 'missing-child'], isOpened: false, customData: {} },
          '2': { id: '2', children: [], isOpened: false, customData: {} },
        },
      };
      const renderItem = createDefaultRenderItem();

      expect(() => {
        render(<Tree initialTree={malformedTree} renderItem={renderItem} />);
      }).not.toThrow();

      // Should render available nodes
      expect(screen.getByTestId('tree-item-1')).toBeInTheDocument();
    });
  });

  describe('Custom data and types', () => {
    interface CustomData {
      name: string;
      value: number;
      color?: string;
    }

    it('should preserve and pass custom data to renderItem', () => {
      const customTree: TreeData<BasicTreeItem<CustomData>> = {
        rootIds: ['1'],
        items: {
          '1': {
            id: '1',
            children: ['2'],
            isOpened: true,
            customData: { name: 'Root', value: 100, color: 'red' },
          },
          '2': {
            id: '2',
            children: [],
            isOpened: false,
            customData: { name: 'Child', value: 50 },
          },
        },
      };

      const renderItem = vi.fn((params: RenderItemParams<BasicTreeItem<CustomData>>) => (
        <div data-testid={`tree-item-${params.item.id}`}>
          {params.item.customData.name}: {params.item.customData.value}
        </div>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      render(<Tree initialTree={customTree} renderItem={renderItem} />);

      expect(renderItem).toHaveBeenCalledWith(
        expect.objectContaining({
          item: expect.objectContaining({
            customData: { name: 'Root', value: 100, color: 'red' },
          }),
        })
      );

      expect(renderItem).toHaveBeenCalledWith(
        expect.objectContaining({
          item: expect.objectContaining({
            customData: { name: 'Child', value: 50 },
          }),
        })
      );
    });

    it('should maintain type safety with custom data', () => {
      const customTree: TreeData<BasicTreeItem<CustomData>> = {
        rootIds: ['1'],
        items: {
          '1': {
            id: '1',
            children: [],
            isOpened: false,
            customData: { name: 'Test', value: 42 },
          },
        },
      };

      const renderItem: (params: RenderItemParams<BasicTreeItem<CustomData>>) => JSX.Element = (params) => (
        <div>
          {/* TypeScript should enforce these properties exist */}
          {params.item.customData.name} - {params.item.customData.value}
          {params.item.customData.color || 'default'}
        </div>
      );

      expect(() => {
        render(<Tree initialTree={customTree} renderItem={renderItem} />);
      }).not.toThrow();
    });
  });

  describe('Performance and optimization', () => {
    it('should memoize flattened tree to avoid unnecessary recalculations', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();

      const { rerender } = render(<Tree initialTree={tree} renderItem={renderItem} />);

      // Clear previous calls
      renderItem.mockClear();

      // Re-render with same tree - should still call renderItem but with same data
      rerender(<Tree initialTree={tree} renderItem={renderItem} />);

      // React will re-render, but the memoization helps with flattening performance
      expect(renderItem).toHaveBeenCalledTimes(1); // Only root node visible initially
    });

    it('should handle large trees efficiently', () => {
      const LARGE_TREE_SIZE = 1000;
      const largeTree: TreeData<BasicTreeItem> = {
        rootIds: ['root'],
        items: {
          root: {
            id: 'root',
            children: Array.from({ length: LARGE_TREE_SIZE }, (_, i) => `child-${i}`),
            isOpened: true,
            customData: {},
          },
        },
      };

      // Add child items
      for (let i = 0; i < LARGE_TREE_SIZE; i++) {
        largeTree.items[`child-${i}`] = {
          id: `child-${i}`,
          children: [],
          isOpened: false,
          customData: {},
        };
      }

      const renderItem = createDefaultRenderItem();

      const startTime = performance.now();
      render(<Tree initialTree={largeTree} renderItem={renderItem} />);
      const endTime = performance.now();

      // Should render efficiently
      expect(endTime - startTime).toBeLessThan(500); // More realistic threshold for large trees
      expect(renderItem).toHaveBeenCalledTimes(LARGE_TREE_SIZE + 1); // +1 for root
    });
  });

  describe('Edge cases', () => {
    it('should handle tree with no root nodes', () => {
      const emptyTree: TreeData<BasicTreeItem> = { rootIds: [], items: {} };
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={emptyTree} renderItem={renderItem} />);

      expect(renderItem).not.toHaveBeenCalled();
    });

    it('should handle single node tree', () => {
      const singleNodeTree: TreeData<BasicTreeItem> = {
        rootIds: ['only'],
        items: {
          only: { id: 'only', children: [], isOpened: false, customData: {} },
        },
      };
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={singleNodeTree} renderItem={renderItem} />);

      expect(screen.getByTestId('tree-item-only')).toBeInTheDocument();
      expect(renderItem).toHaveBeenCalledTimes(1);
    });

    it('should handle deeply nested tree structures', () => {
      const DEPTH = 100;
      const deepTree: TreeData<BasicTreeItem> = {
        rootIds: ['root'],
        items: {},
      };

      // Create linear deep tree
      let currentId = 'root';
      for (let i = 0; i < DEPTH; i++) {
        const nextId = `node-${i}`;
        deepTree.items[currentId] = {
          id: currentId,
          children: [nextId],
          isOpened: true,
          customData: {},
        };
        currentId = nextId;
      }
      deepTree.items[currentId] = {
        id: currentId,
        children: [],
        isOpened: false,
        customData: {},
      };

      const renderItem = createDefaultRenderItem();

      expect(() => {
        render(<Tree initialTree={deepTree} renderItem={renderItem} />);
      }).not.toThrow();

      expect(renderItem).toHaveBeenCalledTimes(DEPTH + 1);
    });
  });
});