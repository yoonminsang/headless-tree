import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { removeTreeItem } from './removeTreeItem';
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

describe('removeTreeItem', () => {
  describe('Leaf node removal', () => {
    it('should remove a leaf node', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: '4',
        parentMap,
      });

      expect(result.items['4']).toBeUndefined();
      expect(result.items['2'].children).toEqual(['5']);
      expect(Object.keys(result.items)).toHaveLength(6); // 7 - 1
    });

    it('should remove the only child from parent', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: '7',
        parentMap,
      });

      expect(result.items['7']).toBeUndefined();
      expect(result.items['6'].children).toEqual([]);
      expect(Object.keys(result.items)).toHaveLength(6);
    });
  });

  describe('Node with descendants removal', () => {
    it('should remove a node and all its descendants', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: '2',
        parentMap,
      });

      // '2', '4', '5' should be removed
      expect(result.items['2']).toBeUndefined();
      expect(result.items['4']).toBeUndefined();
      expect(result.items['5']).toBeUndefined();
      expect(result.items['1'].children).toEqual(['3']);
      expect(Object.keys(result.items)).toHaveLength(4); // 7 - 3
    });

    it('should remove deeply nested descendants', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: '3',
        parentMap,
      });

      // '3', '6', '7' should be removed
      expect(result.items['3']).toBeUndefined();
      expect(result.items['6']).toBeUndefined();
      expect(result.items['7']).toBeUndefined();
      expect(result.items['1'].children).toEqual(['2']);
      expect(Object.keys(result.items)).toHaveLength(4); // 7 - 3
    });
  });

  describe('Root node removal', () => {
    it('should remove a root node and all its descendants', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: '1',
        parentMap,
      });

      // All items should be removed
      expect(result.rootIds).toEqual([]);
      expect(Object.keys(result.items)).toHaveLength(0);
    });

    it('should remove one root from multi-root tree', () => {
      const tree = createMultiRootTree();
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: 'a',
        parentMap,
      });

      // 'a', 'b', 'c' should be removed
      expect(result.rootIds).toEqual(['d']);
      expect(result.items['a']).toBeUndefined();
      expect(result.items['b']).toBeUndefined();
      expect(result.items['c']).toBeUndefined();
      expect(result.items['d']).toBeDefined();
      expect(result.items['e']).toBeDefined();
      expect(Object.keys(result.items)).toHaveLength(2);
    });

    it('should handle removing last root item', () => {
      const tree = createMultiRootTree();
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: 'd',
        parentMap,
      });

      expect(result.rootIds).toEqual(['a']);
      expect(result.items['d']).toBeUndefined();
      expect(result.items['e']).toBeUndefined();
      expect(Object.keys(result.items)).toHaveLength(3); // a, b, c
    });
  });

  describe('Error handling', () => {
    it('should log error for non-existent item', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: 'non-existent',
        parentMap,
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

      removeTreeItem({
        tree,
        itemId: '2',
        parentMap,
      });

      expect(tree.rootIds).toEqual(originalRootIds);
      expect(tree.items).toEqual(originalItems);
    });

    it('should preserve unaffected items', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: '2',
        parentMap,
      });

      // Items '3', '6', '7' should remain unchanged
      expect(result.items['3']).toEqual(tree.items['3']);
      expect(result.items['6']).toEqual(tree.items['6']);
      expect(result.items['7']).toEqual(tree.items['7']);
    });
  });

  describe('Edge cases', () => {
    it('should handle single item tree', () => {
      const tree: TreeData<BasicTreeItem> = {
        rootIds: ['only'],
        items: {
          only: createTreeItem('only'),
        },
      };
      const parentMap = buildParentMap(tree);

      const result = removeTreeItem({
        tree,
        itemId: 'only',
        parentMap,
      });

      expect(result.rootIds).toEqual([]);
      expect(Object.keys(result.items)).toHaveLength(0);
    });

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

      const result = removeTreeItem({
        tree,
        itemId: 2,
        parentMap,
      });

      expect(result.items[2]).toBeUndefined();
      expect(result.items[1].children).toEqual([3]);
    });

    it('should handle complex nested removal', () => {
      const tree = createBasicTree();
      const parentMap = buildParentMap(tree);

      // Remove node with grandchildren
      const result = removeTreeItem({
        tree,
        itemId: '6',
        parentMap,
      });

      expect(result.items['6']).toBeUndefined();
      expect(result.items['7']).toBeUndefined();
      expect(result.items['3'].children).toEqual([]);
      expect(Object.keys(result.items)).toHaveLength(5); // 7 - 2
    });
  });

  describe('Custom data preservation', () => {
    it('should preserve custom data in remaining items', () => {
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
            customData: { label: 'Child 2', value: 2 },
          }),
        },
      };
      const parentMap = buildParentMap(customTree);

      const result = removeTreeItem({
        tree: customTree,
        itemId: 'child1',
        parentMap,
      });

      expect(result.items['child1']).toBeUndefined();
      expect(result.items['root'].customData).toEqual({ label: 'Root', value: 0 });
      expect(result.items['child2'].customData).toEqual({ label: 'Child 2', value: 2 });
    });
  });
});
