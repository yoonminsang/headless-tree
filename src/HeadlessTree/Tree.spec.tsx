import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { Tree, type TreeRef } from './Tree';
import type { BasicTreeItem, TreeData, RenderItemParams } from './types';
import * as logModule from '../internal/logError';

/**
 * Basic test tree structure:
 *
 * ┌─ 1 (closed)
 * │  ├─ 2 (opened)
 * │  └─ 3 (closed)
 * └─ 4 (opened)
 */
const createBasicTree = (): TreeData<BasicTreeItem> => ({
  rootIds: ['1', '4'],
  items: {
    '1': { id: '1', children: ['2', '3'], isOpened: false, customData: {} },
    '2': { id: '2', children: [], isOpened: true, customData: {} },
    '3': { id: '3', children: [], isOpened: false, customData: {} },
    '4': { id: '4', children: [], isOpened: true, customData: {} },
  },
});

// Default render function
const createDefaultRenderItem = () =>
  vi.fn(({ item, open, close, toggleOpenState }: RenderItemParams<BasicTreeItem>) => (
    <div data-testid={`tree-item-${item.id}`}>
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

  describe('Basic rendering', () => {
    it('should render tree items based on open/closed state', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      // Only open nodes should be visible
      expect(screen.getByTestId('tree-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('tree-item-4')).toBeInTheDocument();
      // Children of closed nodes should not be visible
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tree-item-3')).not.toBeInTheDocument();
    });

    it('should handle empty tree', () => {
      const emptyTree: TreeData<BasicTreeItem> = { rootIds: [], items: {} };
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={emptyTree} renderItem={renderItem} />);

      expect(renderItem).not.toHaveBeenCalled();
    });
  });

  describe('User interactions', () => {
    it('should open nodes with open button', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      // Initially closed state
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();

      // Click open button
      fireEvent.click(screen.getByTestId('open-1'));
      expect(screen.getByTestId('tree-item-2')).toBeInTheDocument();
    });

    it('should close nodes with close button', () => {
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
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();
    });

    it('should open and close nodes with toggle button', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();

      render(<Tree initialTree={tree} renderItem={renderItem} />);

      // Initially closed state
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();

      // Toggle to open
      fireEvent.click(screen.getByTestId('toggle-1'));
      expect(screen.getByTestId('tree-item-2')).toBeInTheDocument();

      // Toggle to close
      fireEvent.click(screen.getByTestId('toggle-1'));
      expect(screen.queryByTestId('tree-item-2')).not.toBeInTheDocument();
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
    });

    it('should allow programmatic control through ref', () => {
      const tree = createBasicTree();
      const renderItem = createDefaultRenderItem();
      const ref = createRef<TreeRef<BasicTreeItem>>();

      render(<Tree ref={ref} initialTree={tree} renderItem={renderItem} />);

      // Check initial state
      expect(ref.current?.tree.items['1'].isOpened).toBe(false);

      // Open node through ref
      act(() => {
        ref.current?.open('1');
      });
      expect(ref.current?.tree.items['1'].isOpened).toBe(true);
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

      // Re-render with new tree
      const newTree = {
        ...initialTree,
        items: {
          ...initialTree.items,
          '1': { ...initialTree.items['1'], isOpened: false },
        },
      };

      rerender(
        <Tree ref={ref} initialTree={newTree} renderItem={renderItem} options={{ syncWithInitialTree: true }} />
      );

      // Should sync with new tree
      expect(ref.current?.tree.items['1'].isOpened).toBe(false);
    });
  });
});
