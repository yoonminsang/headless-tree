import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useTreeState } from './useTreeState';
import type { BasicTreeItem, TreeData } from './types';
import * as logModule from '../internal/logError';

const createTreeItem = <T = Record<string, unknown>>(
  id: string | number,
  options?: Partial<BasicTreeItem<T>>
): BasicTreeItem<T> => ({
  id,
  children: [],
  isOpened: false,
  customData: {} as T,
  ...options,
});

const createTree = <T = Record<string, unknown>>(config: {
  rootIds: (string | number)[];
  items: Record<string | number, BasicTreeItem<T>>;
}): TreeData<BasicTreeItem<T>> => config;

/**
 * Basic tree structure for testing:
 *
 * 1 (closed)
 * ├── 2 (opened)
 * │   └── 4 (closed)
 * └── 3 (closed)
 *     └── 5 (opened)
 */
const createBasicTree = (): TreeData<BasicTreeItem> =>
  createTree({
    rootIds: ['1'],
    items: {
      '1': createTreeItem('1', { children: ['2', '3'], isOpened: false }),
      '2': createTreeItem('2', { children: ['4'], isOpened: true }),
      '3': createTreeItem('3', { children: ['5'], isOpened: false }),
      '4': createTreeItem('4'),
      '5': createTreeItem('5', { isOpened: true }),
    },
  });

/**
 * Complex tree structure:
 *
 * root1
 * ├── a
 * │   ├── a1
 * │   └── a2
 * │       └── a2-1
 * └── b
 *     └── b1
 * root2
 * └── c
 */
const createComplexTree = (): TreeData<BasicTreeItem> =>
  createTree({
    rootIds: ['root1', 'root2'],
    items: {
      root1: createTreeItem('root1', { children: ['a', 'b'], isOpened: true }),
      root2: createTreeItem('root2', { children: ['c'], isOpened: true }),
      a: createTreeItem('a', { children: ['a1', 'a2'], isOpened: true }),
      b: createTreeItem('b', { children: ['b1'], isOpened: false }),
      c: createTreeItem('c', { isOpened: false }),
      a1: createTreeItem('a1'),
      a2: createTreeItem('a2', { children: ['a2-1'], isOpened: true }),
      b1: createTreeItem('b1'),
      'a2-1': createTreeItem('a2-1'),
    },
  });

describe('useTreeState', () => {
  describe('Core functionality', () => {
    it('should initialize with the provided initial tree', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      expect(result.current.tree).toEqual(initialTree);
    });

    it('should open a closed node', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.open('1');
      });

      expect(result.current.tree.items['1'].isOpened).toBe(true);
      // Other nodes should not be changed
      expect(result.current.tree.items['2'].isOpened).toBe(true);
      expect(result.current.tree.items['3'].isOpened).toBe(false);
    });

    it('should close an opened node', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.close('2');
      });

      expect(result.current.tree.items['2'].isOpened).toBe(false);
      // Other nodes should not be changed
      expect(result.current.tree.items['1'].isOpened).toBe(false);
      expect(result.current.tree.items['5'].isOpened).toBe(true);
    });

    it('should toggle node state from closed to opened', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.toggleOpen('1');
      });

      expect(result.current.tree.items['1'].isOpened).toBe(true);
    });

    it('should toggle node state from opened to closed', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.toggleOpen('2');
      });

      expect(result.current.tree.items['2'].isOpened).toBe(false);
    });

    it('should open all nodes', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.openAll();
      });

      Object.values(result.current.tree.items).forEach((item) => {
        expect(item.isOpened).toBe(true);
      });
    });

    it('should close all nodes', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.closeAll();
      });

      Object.values(result.current.tree.items).forEach((item) => {
        expect(item.isOpened).toBe(false);
      });
    });

    it('handles empty tree', () => {
      const emptyTree = createTree({ rootIds: [], items: {} });
      const { result } = renderHook(() => useTreeState({ initialTree: emptyTree }));

      expect(result.current.tree).toEqual(emptyTree);

      // Should not throw error when performing operations on empty tree
      act(() => {
        result.current.openAll();
        result.current.closeAll();
      });

      expect(result.current.tree).toEqual(emptyTree);
    });
  });

  describe('Immutability', () => {
    it('should maintain immutability - not mutate original tree', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      const originalIsOpened = initialTree.items['1'].isOpened;

      act(() => {
        result.current.open('1');
      });

      // Original tree should not be mutated
      expect(initialTree.items['1'].isOpened).toBe(originalIsOpened);
      // But hook's state should be changed
      expect(result.current.tree.items['1'].isOpened).toBe(true);
    });

    it('should return new tree object reference when state changes', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      const initialTreeRef = result.current.tree;

      act(() => {
        result.current.open('1');
      });

      // Reference should change (immutability)
      expect(result.current.tree).not.toBe(initialTreeRef);
    });
  });

  describe('Error handling', () => {
    let logErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      logErrorSpy = vi.spyOn(logModule, 'logError').mockImplementation(() => {});
    });

    afterEach(() => {
      logErrorSpy.mockRestore();
    });

    it('should handle gracefully and log when open is called on non-existent node', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.open('non-existent');
      });

      // State should not be changed
      expect(result.current.tree).toEqual(initialTree);

      expect(logErrorSpy).toHaveBeenCalledOnce();
    });

    it('should handle gracefully and log when close is called on non-existent node', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.close('invalid-id');
      });

      // State should not be changed
      expect(result.current.tree).toEqual(initialTree);

      expect(logErrorSpy).toHaveBeenCalledOnce();
    });

    it('should handle gracefully and log when toggleOpen is called on non-existent node', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.toggleOpen('missing-node');
      });

      // State should not be changed
      expect(result.current.tree).toEqual(initialTree);

      expect(logErrorSpy).toHaveBeenCalledOnce();
    });
  });

  describe('initialOpenedIds option', () => {
    it('should use initialOpenedIds instead of isOpened flags when provided', () => {
      const tree = createTree({
        rootIds: ['1', '2', '3'],
        items: {
          '1': createTreeItem('1', { isOpened: false }), // isOpened is false
          '2': createTreeItem('2', { isOpened: true }), // isOpened is true
          '3': createTreeItem('3'), // no isOpened
        },
      });

      const { result } = renderHook(() =>
        useTreeState({
          initialTree: tree,
          options: { initialOpenedIds: ['1', '3'] }, // Only 1 and 3 should be opened
        })
      );

      // initialOpenedIds takes precedence
      expect(result.current.tree.items['1'].isOpened).toBe(true); // opened by initialOpenedIds
      expect(result.current.tree.items['2'].isOpened).toBe(false); // not in initialOpenedIds
      expect(result.current.tree.items['3'].isOpened).toBe(true); // opened by initialOpenedIds
    });

    it('should fall back to isOpened flags when initialOpenedIds is not provided', () => {
      const tree = createTree({
        rootIds: ['1', '2'],
        items: {
          '1': createTreeItem('1', { isOpened: true }),
          '2': createTreeItem('2', { isOpened: false }),
        },
      });

      const { result } = renderHook(() =>
        useTreeState({
          initialTree: tree,
          options: {}, // no initialOpenedIds
        })
      );

      // Should use isOpened flags from tree items
      expect(result.current.tree.items['1'].isOpened).toBe(true);
      expect(result.current.tree.items['2'].isOpened).toBe(false);
    });

    it('should handle empty initialOpenedIds array', () => {
      const tree = createTree({
        rootIds: ['1', '2'],
        items: {
          '1': createTreeItem('1', { isOpened: true }),
          '2': createTreeItem('2', { isOpened: true }),
        },
      });

      const { result } = renderHook(() =>
        useTreeState({
          initialTree: tree,
          options: { initialOpenedIds: [] }, // explicitly empty
        })
      );

      // All should be closed because initialOpenedIds is empty
      expect(result.current.tree.items['1'].isOpened).toBe(false);
      expect(result.current.tree.items['2'].isOpened).toBe(false);
    });

    it('should ignore non-existent IDs in initialOpenedIds', () => {
      const tree = createTree({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1'),
        },
      });

      const { result } = renderHook(() =>
        useTreeState({
          initialTree: tree,
          options: { initialOpenedIds: ['1', 'non-existent', '999'] },
        })
      );

      // Only '1' should be opened, non-existent IDs are ignored
      expect(result.current.tree.items['1'].isOpened).toBe(true);
      // Should not throw error for non-existent IDs
    });
  });

  describe('syncWithInitialTree option', () => {
    it('should sync with initialTree when option is true', () => {
      const initialTree = createBasicTree();
      const { result, rerender } = renderHook(
        ({ tree }) =>
          useTreeState({
            initialTree: tree,
            options: { syncWithInitialTree: true },
          }),
        { initialProps: { tree: initialTree } }
      );

      // Change state
      act(() => {
        result.current.open('1');
      });

      expect(result.current.tree.items['1'].isOpened).toBe(true);

      // Update with new initial tree
      const newTree = {
        ...initialTree,
        items: {
          ...initialTree.items,
          '1': { ...initialTree.items['1'], isOpened: false },
        },
      };

      rerender({ tree: newTree });

      // Should sync with new tree since syncWithInitialTree is true
      expect(result.current.tree.items['1'].isOpened).toBe(false);
    });

    it('should not sync with initialTree when option is false', () => {
      const initialTree = createBasicTree();
      const { result, rerender } = renderHook(
        ({ tree }) =>
          useTreeState({
            initialTree: tree,
            options: { syncWithInitialTree: false },
          }),
        { initialProps: { tree: initialTree } }
      );

      // Change state
      act(() => {
        result.current.open('1');
      });

      expect(result.current.tree.items['1'].isOpened).toBe(true);

      // Update with new initial tree
      const newTree = {
        ...initialTree,
        items: {
          ...initialTree.items,
          '1': { ...initialTree.items['1'], isOpened: false },
        },
      };

      rerender({ tree: newTree });

      // Should maintain existing state since syncWithInitialTree is false
      expect(result.current.tree.items['1'].isOpened).toBe(true);
    });

    it('should sync initialOpenedIds when both syncWithInitialTree and initialOpenedIds are used', () => {
      const tree = createTree({
        rootIds: ['1', '2'],
        items: {
          '1': createTreeItem('1'),
          '2': createTreeItem('2'),
        },
      });

      const { result, rerender } = renderHook(
        ({ openedIds }: { openedIds: string[] }) =>
          useTreeState({
            initialTree: tree,
            options: {
              syncWithInitialTree: true,
              initialOpenedIds: openedIds,
            },
          }),
        { initialProps: { openedIds: ['1'] } }
      );

      expect(result.current.tree.items['1'].isOpened).toBe(true);
      expect(result.current.tree.items['2'].isOpened).toBe(false);

      // Change initialOpenedIds
      rerender({ openedIds: ['2'] });

      // Should sync with new initialOpenedIds
      expect(result.current.tree.items['1'].isOpened).toBe(false);
      expect(result.current.tree.items['2'].isOpened).toBe(true);
    });
  });

  it('should return stable callback references', () => {
    const initialTree = createBasicTree();
    const { result, rerender } = renderHook(() => useTreeState({ initialTree }));

    const initialCallbacks = {
      open: result.current.open,
      close: result.current.close,
      toggleOpen: result.current.toggleOpen,
      openAll: result.current.openAll,
      closeAll: result.current.closeAll,
    };

    // Rerender
    rerender();

    // Callback references should be stable
    expect(result.current.open).toBe(initialCallbacks.open);
    expect(result.current.close).toBe(initialCallbacks.close);
    expect(result.current.toggleOpen).toBe(initialCallbacks.toggleOpen);
    expect(result.current.openAll).toBe(initialCallbacks.openAll);
    expect(result.current.closeAll).toBe(initialCallbacks.closeAll);
  });

  describe('Complex scenarios', () => {
    it('should handle multiple rapid operations', () => {
      const initialTree = createBasicTree();
      const { result } = renderHook(() => useTreeState({ initialTree }));

      act(() => {
        result.current.open('1');
        result.current.close('2');
        result.current.toggleOpen('3');
        result.current.open('4');
      });

      expect(result.current.tree.items['1'].isOpened).toBe(true);
      expect(result.current.tree.items['2'].isOpened).toBe(false);
      expect(result.current.tree.items['3'].isOpened).toBe(true); // was false, toggled to true
      expect(result.current.tree.items['4'].isOpened).toBe(true);
    });

    it('should handle complex tree operations in sequence', () => {
      const tree = createComplexTree();
      const { result } = renderHook(() => useTreeState({ initialTree: tree }));

      // Check initial state
      expect(result.current.tree.items['b'].isOpened).toBe(false);
      expect(result.current.tree.items['c'].isOpened).toBe(false);

      // Perform sequential operations
      act(() => {
        result.current.open('b'); // Open node b
        result.current.open('c'); // Open node c
        result.current.close('a'); // Close node a
        result.current.toggleOpen('root2'); // Toggle root2 (true -> false)
      });

      expect(result.current.tree.items['b'].isOpened).toBe(true);
      expect(result.current.tree.items['c'].isOpened).toBe(true);
      expect(result.current.tree.items['a'].isOpened).toBe(false);
      expect(result.current.tree.items['root2'].isOpened).toBe(false);
    });
  });

  describe('isOpened initialization edge cases', () => {
    it('should correctly handle mixed isOpened states (undefined, true, false)', () => {
      const tree = createTree({
        rootIds: ['1', '2', '3'],
        items: {
          '1': createTreeItem('1', { isOpened: true }),
          '2': createTreeItem('2', { isOpened: false }),
          '3': createTreeItem('3'), // isOpened is undefined
        },
      });

      const { result } = renderHook(() => useTreeState({ initialTree: tree }));

      // isOpened: true should remain true
      expect(result.current.tree.items['1'].isOpened).toBe(true);
      // isOpened: false should remain false
      expect(result.current.tree.items['2'].isOpened).toBe(false);
      // isOpened: undefined should become false (not in openedIds set)
      expect(result.current.tree.items['3'].isOpened).toBe(false);
    });

    it('should verify extractOpenedIds only adds explicitly opened items', () => {
      const tree = createTree({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2', '3'], isOpened: false }),
          '2': createTreeItem('2'), // undefined
          '3': createTreeItem('3', { isOpened: true }),
        },
      });

      const { result } = renderHook(() => useTreeState({ initialTree: tree }));

      // Only item '3' with isOpened: true should be in the opened state
      expect(result.current.tree.items['1'].isOpened).toBe(false);
      expect(result.current.tree.items['2'].isOpened).toBe(false);
      expect(result.current.tree.items['3'].isOpened).toBe(true);
    });
  });

  describe('Custom data preservation', () => {
    interface CustomData {
      name: string;
      value: number;
      metadata?: {
        tags: string[];
        priority: number;
      };
    }

    it('should preserve custom data during state changes', () => {
      const tree = createTree<CustomData>({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', {
            children: ['2'],
            isOpened: false,
            customData: {
              name: 'Root Node',
              value: 100,
              metadata: {
                tags: ['important', 'root'],
                priority: 1,
              },
            },
          }),
          '2': createTreeItem('2', {
            customData: {
              name: 'Child Node',
              value: 50,
            },
          }),
        },
      });

      const { result } = renderHook(() => useTreeState({ initialTree: tree }));

      act(() => {
        result.current.open('1');
      });

      // State should be changed
      expect(result.current.tree.items['1'].isOpened).toBe(true);
      // But custom data should be preserved
      expect(result.current.tree.items['1'].customData).toEqual({
        name: 'Root Node',
        value: 100,
        metadata: {
          tags: ['important', 'root'],
          priority: 1,
        },
      });
      expect(result.current.tree.items['2'].customData).toEqual({
        name: 'Child Node',
        value: 50,
      });
    });

    it('should maintain custom data integrity across multiple operations', () => {
      const tree = createTree<CustomData>({
        rootIds: ['root'],
        items: {
          root: createTreeItem('root', {
            children: ['a', 'b'],
            isOpened: true,
            customData: { name: 'Root', value: 0 },
          }),
          a: createTreeItem('a', {
            customData: { name: 'Node A', value: 1 },
          }),
          b: createTreeItem('b', {
            customData: { name: 'Node B', value: 2 },
          }),
        },
      });

      const { result } = renderHook(() => useTreeState({ initialTree: tree }));

      act(() => {
        result.current.openAll();
        result.current.close('root');
        result.current.toggleOpen('a');
      });

      // All custom data should be preserved
      expect(result.current.tree.items['root'].customData.name).toBe('Root');
      expect(result.current.tree.items['a'].customData.value).toBe(1);
      expect(result.current.tree.items['b'].customData.name).toBe('Node B');
    });
  });
});
