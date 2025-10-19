import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { moveTreeItem } from './moveTreeItem';
import type { BasicTreeItem, TreeData } from '../types';
import * as logModule from '../../internal/logError';
import { buildParentMap } from './buildParentMap';

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

/**
 * Basic test tree structure:
 *
 * 1
 * ├── 2
 * │   ├── 4
 * │   └── 5
 * └── 3
 *     └── 6
 *         └── 7
 */
const createBasicTree = (): TreeData<BasicTreeItem> => ({
  rootIds: ['1'],
  items: {
    '1': createTreeItem('1', { children: ['2', '3'], isOpened: true }),
    '2': createTreeItem('2', { children: ['4', '5'], isOpened: true }),
    '3': createTreeItem('3', { children: ['6'], isOpened: true }),
    '4': createTreeItem('4'),
    '5': createTreeItem('5'),
    '6': createTreeItem('6', { children: ['7'], isOpened: true }),
    '7': createTreeItem('7'),
  },
});

/**
 * Multi-root tree structure:
 *
 * a
 * └── b
 *     └── c
 * d
 * └── e
 */
const createMultiRootTree = (): TreeData<BasicTreeItem> => ({
  rootIds: ['a', 'd'],
  items: {
    a: createTreeItem('a', { children: ['b'], isOpened: true }),
    b: createTreeItem('b', { children: ['c'], isOpened: true }),
    c: createTreeItem('c'),
    d: createTreeItem('d', { children: ['e'], isOpened: true }),
    e: createTreeItem('e'),
  },
});

// Mock setup for error logging tests
let logErrorSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(() => {
  logErrorSpy = vi.spyOn(logModule, 'logError').mockImplementation(() => {});
});

afterEach(() => {
  logErrorSpy?.mockRestore();
});

describe('moveTreeItem', () => {
  describe('Move within same parent', () => {
    it('should move item to specific index within same parent', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '5' to index 0 within parent '2'
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '5',
        target: { parentId: '2', index: 0 },
      });

      expect(result.items['2'].children).toEqual(['5', '4']);
    });

    it('should move item to first position within same parent', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '5' to first position within parent '2'
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '5',
        target: { parentId: '2', position: 'first' },
      });

      expect(result.items['2'].children).toEqual(['5', '4']);
    });

    it('should move item to last position within same parent', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '4' to last position within parent '2'
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '4',
        target: { parentId: '2', position: 'last' },
      });

      expect(result.items['2'].children).toEqual(['5', '4']);
    });
  });

  describe('Move to different parent', () => {
    it('should move item to specific index in different parent', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '4' from parent '2' to parent '3' at index 0
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '4',
        target: { parentId: '3', index: 0 },
      });

      expect(result.items['2'].children).toEqual(['5']);
      expect(result.items['3'].children).toEqual(['4', '6']);
    });

    it('should move item to first position in different parent', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '5' from parent '2' to parent '3' at first position
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '5',
        target: { parentId: '3', position: 'first' },
      });

      expect(result.items['2'].children).toEqual(['4']);
      expect(result.items['3'].children).toEqual(['5', '6']);
    });

    it('should move item to last position in different parent', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '4' from parent '2' to parent '3' at last position
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '4',
        target: { parentId: '3', position: 'last' },
      });

      expect(result.items['2'].children).toEqual(['5']);
      expect(result.items['3'].children).toEqual(['6', '4']);
    });

    it('should move item to empty parent', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '5' to leaf node '7' (which has no children)
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '5',
        target: { parentId: '7', position: 'first' },
      });

      expect(result.items['2'].children).toEqual(['4']);
      expect(result.items['7'].children).toEqual(['5']);
    });
  });

  describe('Move to/from root level', () => {
    it('should move item from parent to root at specific index', () => {
      const tree = createMultiRootTree();
      const parentMap = buildParentMap(tree);

      // Move 'b' from parent 'a' to root at index 1
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: 'b',
        target: { parentId: null, index: 1 },
      });

      expect(result.rootIds).toEqual(['a', 'b', 'd']);
      expect(result.items['a'].children).toEqual([]);
    });

    it('should move item from parent to root at first position', () => {
      const tree = createMultiRootTree();
      const parentMap = buildParentMap(tree);

      // Move 'e' from parent 'd' to root at first position
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: 'e',
        target: { parentId: null, position: 'first' },
      });

      expect(result.rootIds).toEqual(['e', 'a', 'd']);
      expect(result.items['d'].children).toEqual([]);
    });

    it('should move item from parent to root at last position', () => {
      const tree = createMultiRootTree();
      const parentMap = buildParentMap(tree);

      // Move 'c' from parent 'b' to root at last position
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: 'c',
        target: { parentId: null, position: 'last' },
      });

      expect(result.rootIds).toEqual(['a', 'd', 'c']);
      expect(result.items['b'].children).toEqual([]);
    });

    it('should move item from root to parent at specific index', () => {
      const tree = createMultiRootTree();
      const parentMap = buildParentMap(tree);

      // Move 'd' from root to parent 'a' at index 0
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: 'd',
        target: { parentId: 'a', index: 0 },
      });

      expect(result.rootIds).toEqual(['a']);
      expect(result.items['a'].children).toEqual(['d', 'b']);
    });

    it('should move item from root to parent at first position', () => {
      const tree = createMultiRootTree();
      const parentMap = buildParentMap(tree);

      // Move 'd' from root to parent 'a' at first position
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: 'd',
        target: { parentId: 'a', position: 'first' },
      });

      expect(result.rootIds).toEqual(['a']);
      expect(result.items['a'].children).toEqual(['d', 'b']);
    });

    it('should move item from root to parent at last position', () => {
      const tree = createMultiRootTree();
      const parentMap = buildParentMap(tree);

      // Move 'd' from root to parent 'a' at last position
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: 'd',
        target: { parentId: 'a', position: 'last' },
      });

      expect(result.rootIds).toEqual(['a']);
      expect(result.items['a'].children).toEqual(['b', 'd']);
    });

    it('should reorder root items', () => {
      const tree = createMultiRootTree();
      const parentMap = buildParentMap(tree);

      // Move 'd' to first position at root
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: 'd',
        target: { parentId: null, position: 'first' },
      });

      expect(result.rootIds).toEqual(['d', 'a']);
    });
  });

  describe('Move node with children', () => {
    it('should move parent node with all its children', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '2' (which has children '4', '5') to parent '3'
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '2',
        target: { parentId: '3', position: 'first' },
      });

      expect(result.items['1'].children).toEqual(['3']);
      expect(result.items['3'].children).toEqual(['2', '6']);
      expect(result.items['2'].children).toEqual(['4', '5']); // Children preserved
    });

    it('should move deeply nested subtree', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '3' (which has nested children) to parent '2'
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '3',
        target: { parentId: '2', position: 'last' },
      });

      expect(result.items['1'].children).toEqual(['2']);
      expect(result.items['2'].children).toEqual(['4', '5', '3']);
      expect(result.items['3'].children).toEqual(['6']); // Nested children preserved
      expect(result.items['6'].children).toEqual(['7']); // Deep nesting preserved
    });
  });

  describe('Error handling', () => {
    it('should log error for invalid source ID', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: 'non-existent',
        target: { parentId: '2', position: 'first' },
      });

      expect(logErrorSpy).toHaveBeenCalledOnce();
      expect(result).toEqual(tree); // Return original tree unchanged
    });

    it('should log error for invalid parent ID', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '4',
        target: { parentId: 'non-existent', position: 'first' },
      });

      expect(logErrorSpy).toHaveBeenCalledOnce();
      expect(result).toEqual(tree); // Return original tree unchanged
    });
  });

  describe('Data integrity', () => {
    it('should not mutate original tree', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);
      const originalRootIds = [...tree.rootIds];
      const originalItems = { ...tree.items };
      const originalParent2Children = [...tree.items['2'].children];

      moveTreeItem({
        tree,
        parentMap,
        sourceId: '4',
        target: { parentId: '3', position: 'first' },
      });

      expect(tree.rootIds).toEqual(originalRootIds);
      expect(tree.items).toEqual(originalItems);
      expect(tree.items['2'].children).toEqual(originalParent2Children);
    });

    it('should preserve all item properties', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '4',
        target: { parentId: '3', position: 'first' },
      });

      // Moved item should preserve all properties
      expect(result.items['4'].id).toBe(tree.items['4'].id);
      expect(result.items['4'].isOpened).toBe(tree.items['4'].isOpened);
      expect(result.items['4'].customData).toBe(tree.items['4'].customData);

      // Unaffected items should remain unchanged
      expect(result.items['1']).toEqual(tree.items['1']);
      expect(result.items['5']).toEqual(tree.items['5']);
      expect(result.items['7']).toEqual(tree.items['7']);
    });
  });

  describe('Edge cases', () => {
    it('should handle numeric IDs', () => {
      const tree: TreeData<BasicTreeItem> = {
        rootIds: [1],
        items: {
          1: createTreeItem(1, { children: [2, 3] }),
          2: createTreeItem(2),
          3: createTreeItem(3),
        },
      };
      const parentMap = buildParentMap(tree);

      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: 2,
        target: { parentId: 1, index: 1 },
      });

      expect(result.items[1].children).toEqual([3, 2]);
    });

    it('should handle moving to same position (no-op)', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '4' to its current position (index 0 in parent '2')
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '4',
        target: { parentId: '2', index: 0 },
      });

      expect(result.items['2'].children).toEqual(['4', '5']);
    });

    it('should handle single child movement', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Move '6' (only child of '3') to parent '2'
      const result = moveTreeItem({
        tree,
        parentMap,
        sourceId: '6',
        target: { parentId: '2', position: 'last' },
      });

      expect(result.items['3'].children).toEqual([]);
      expect(result.items['2'].children).toEqual(['4', '5', '6']);
    });
  });

  describe('Custom data preservation', () => {
    it('should preserve custom data in all items', () => {
      type CustomData = { label: string; value: number };
      const customTree: TreeData<BasicTreeItem<CustomData>> = {
        rootIds: ['root'],
        items: {
          root: createTreeItem('root', {
            children: ['child1', 'child2'],
            customData: { label: 'Root', value: 0 },
          }),
          child1: createTreeItem('child1', {
            customData: { label: 'Child 1', value: 1 },
          }),
          child2: createTreeItem('child2', {
            children: ['grandchild'],
            customData: { label: 'Child 2', value: 2 },
          }),
          grandchild: createTreeItem('grandchild', {
            customData: { label: 'Grandchild', value: 3 },
          }),
        },
      };
      const parentMap = buildParentMap(customTree);

      const result = moveTreeItem({
        tree: customTree,
        parentMap,
        sourceId: 'child1',
        target: { parentId: 'child2', position: 'first' },
      });

      expect(result.items['child1'].customData).toEqual({ label: 'Child 1', value: 1 });
      expect(result.items['root'].customData).toEqual({ label: 'Root', value: 0 });
      expect(result.items['child2'].customData).toEqual({ label: 'Child 2', value: 2 });
      expect(result.items['child2'].children).toEqual(['child1', 'grandchild']);
    });
  });
});
