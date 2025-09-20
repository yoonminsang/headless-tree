import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { insertTreeItem, insertIdIntoArray } from './insertTreeItem';
import type { BasicTreeItem, TreeData } from '../types';
import * as logModule from '../../internal/logError';

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

describe('insertIdIntoArray', () => {
  const newItem = createTreeItem('new-item');
  const treeItemIds = ['1', '2', '3'];

  describe('Position-based insertion', () => {
    it('should insert at first position', () => {
      const result = insertIdIntoArray({
        position: 'first',
        treeItemIds,
        newItem,
      });
      expect(result).toEqual(['new-item', '1', '2', '3']);
    });

    it('should insert at last position', () => {
      const result = insertIdIntoArray({
        position: 'last',
        treeItemIds,
        newItem,
      });
      expect(result).toEqual(['1', '2', '3', 'new-item']);
    });

    it('should insert at specific numeric position', () => {
      const result = insertIdIntoArray({
        position: 1,
        treeItemIds,
        newItem,
      });
      expect(result).toEqual(['1', 'new-item', '2', '3']);
    });

    it('should insert at position 0', () => {
      const result = insertIdIntoArray({
        position: 0,
        treeItemIds,
        newItem,
      });
      expect(result).toEqual(['new-item', '1', '2', '3']);
    });

    it('should insert at the end when position equals length', () => {
      const result = insertIdIntoArray({
        position: 3,
        treeItemIds,
        newItem,
      });
      expect(result).toEqual(['1', '2', '3', 'new-item']);
    });
  });

  describe('Relative insertion', () => {
    it('should insert before specified item', () => {
      const result = insertIdIntoArray({
        position: { before: '2' },
        treeItemIds,
        newItem,
      });
      expect(result).toEqual(['1', 'new-item', '2', '3']);
    });

    it('should insert after specified item', () => {
      const result = insertIdIntoArray({
        position: { after: '2' },
        treeItemIds,
        newItem,
      });
      expect(result).toEqual(['1', '2', 'new-item', '3']);
    });

    it('should insert before first item', () => {
      const result = insertIdIntoArray({
        position: { before: '1' },
        treeItemIds,
        newItem,
      });
      expect(result).toEqual(['new-item', '1', '2', '3']);
    });

    it('should insert after last item', () => {
      const result = insertIdIntoArray({
        position: { after: '3' },
        treeItemIds,
        newItem,
      });
      expect(result).toEqual(['1', '2', '3', 'new-item']);
    });
  });

  describe('Error handling', () => {
    it('should log error for invalid before position', () => {
      const result = insertIdIntoArray({
        position: { before: 'non-existent' },
        treeItemIds,
        newItem,
      });

      expect(logErrorSpy).toHaveBeenCalledOnce();
      expect(result).toEqual(['1', '2', '3']); // Return original array
    });

    it('should log error for invalid after position', () => {
      const result = insertIdIntoArray({
        position: { after: 'non-existent' },
        treeItemIds,
        newItem,
      });

      expect(logErrorSpy).toHaveBeenCalledOnce();
      expect(result).toEqual(['1', '2', '3']); // Return original array
    });

    it('should log error for out of bounds position (negative)', () => {
      const result = insertIdIntoArray({
        position: -1,
        treeItemIds,
        newItem,
      });

      expect(logErrorSpy).toHaveBeenCalledOnce();
      expect(result).toEqual(['1', '2', '3']); // Return original array
    });

    it('should log error for out of bounds position (too large)', () => {
      const result = insertIdIntoArray({
        position: 4,
        treeItemIds,
        newItem,
      });

      expect(logErrorSpy).toHaveBeenCalledOnce();
      expect(result).toEqual(['1', '2', '3']); // Return original array
    });
  });

  describe('Edge cases', () => {
    it('should handle empty array', () => {
      const result = insertIdIntoArray({
        position: 'first',
        treeItemIds: [],
        newItem,
      });
      expect(result).toEqual(['new-item']);
    });
  });
});

describe('insertTreeItem', () => {
  describe('Root insertion', () => {
    it('should insert new item at root level - first position', () => {
      const tree = createBasicTree();
      const newItem = createTreeItem('new-root');

      const result = insertTreeItem({
        tree,
        parentId: null,
        newItem,
        position: 'first',
      });

      expect(result.rootIds).toEqual(['new-root', '1']);
      expect(result.items['new-root']).toEqual(newItem);
      expect(result.items['1']).toEqual(tree.items['1']); // Original items unchanged
    });

    it('should insert new item at root level - last position', () => {
      const tree = createMultiRootTree();
      const newItem = createTreeItem('new-root');

      const result = insertTreeItem({
        tree,
        parentId: null,
        newItem,
        position: 'last',
      });

      expect(result.rootIds).toEqual(['a', 'd', 'new-root']);
      expect(result.items['new-root']).toEqual(newItem);
    });

    it('should insert new item at root level - specific position', () => {
      const tree = createMultiRootTree();
      const newItem = createTreeItem('new-root');

      const result = insertTreeItem({
        tree,
        parentId: null,
        newItem,
        position: 1,
      });

      expect(result.rootIds).toEqual(['a', 'new-root', 'd']);
      expect(result.items['new-root']).toEqual(newItem);
    });
  });

  describe('Child insertion', () => {
    it('should insert new child at first position', () => {
      const tree = createBasicTree();
      const newItem = createTreeItem('new-child');

      const result = insertTreeItem({
        tree,
        parentId: '2',
        newItem,
        position: 'first',
      });

      expect(result.items['2'].children).toEqual(['new-child', '4', '5']);
      expect(result.items['new-child']).toEqual(newItem);
      expect(result.rootIds).toEqual(tree.rootIds); // Root unchanged
    });

    it('should insert new child at last position', () => {
      const tree = createBasicTree();
      const newItem = createTreeItem('new-child');

      const result = insertTreeItem({
        tree,
        parentId: '2',
        newItem,
        position: 'last',
      });

      expect(result.items['2'].children).toEqual(['4', '5', 'new-child']);
      expect(result.items['new-child']).toEqual(newItem);
    });

    it('should insert new child before existing child', () => {
      const tree = createBasicTree();
      const newItem = createTreeItem('new-child');

      const result = insertTreeItem({
        tree,
        parentId: '2',
        newItem,
        position: { before: '5' },
      });

      expect(result.items['2'].children).toEqual(['4', 'new-child', '5']);
      expect(result.items['new-child']).toEqual(newItem);
    });

    it('should insert new child after existing child', () => {
      const tree = createBasicTree();
      const newItem = createTreeItem('new-child');

      const result = insertTreeItem({
        tree,
        parentId: '2',
        newItem,
        position: { after: '4' },
      });

      expect(result.items['2'].children).toEqual(['4', 'new-child', '5']);
      expect(result.items['new-child']).toEqual(newItem);
    });

    it('should insert new child to leaf node', () => {
      const tree = createBasicTree();
      const newItem = createTreeItem('new-child');

      const result = insertTreeItem({
        tree,
        parentId: '7',
        newItem,
        position: 'first',
      });

      expect(result.items['7'].children).toEqual(['new-child']);
      expect(result.items['new-child']).toEqual(newItem);
    });
  });

  describe('Error handling', () => {
    it('should log error for non-existent parent', () => {
      const tree = createBasicTree();
      const newItem = createTreeItem('new-child');

      const result = insertTreeItem({
        tree,
        parentId: 'non-existent',
        newItem,
        position: 'first',
      });

      expect(logErrorSpy).toHaveBeenCalledOnce();
      // Should return original tree unchanged
      expect(result).toEqual(tree);
      expect(result.items['new-child']).toBeUndefined();
    });

    it('should handle invalid position in child insertion', () => {
      const tree = createBasicTree();
      const newItem = createTreeItem('new-child');

      const result = insertTreeItem({
        tree,
        parentId: '2',
        newItem,
        position: { before: 'non-existent' },
      });

      expect(logErrorSpy).toHaveBeenCalled();
      // Should return original tree when child position is invalid
      expect(result.items['2'].children).toEqual(['4', '5']); // Unchanged
    });
  });

  describe('Data integrity', () => {
    it('should not mutate original tree', () => {
      const tree = createBasicTree();
      const originalRootIds = [...tree.rootIds];
      const originalItems = { ...tree.items };
      const newItem = createTreeItem('new-child');

      insertTreeItem({
        tree,
        parentId: '2',
        newItem,
        position: 'first',
      });

      expect(tree.rootIds).toEqual(originalRootIds);
      expect(tree.items).toEqual(originalItems);
    });

    it('should preserve all original items and properties', () => {
      const tree = createBasicTree();
      const newItem = createTreeItem('new-child');

      const result = insertTreeItem({
        tree,
        parentId: '1',
        newItem,
        position: 'last',
      });

      // All original items should be preserved
      Object.keys(tree.items).forEach((key) => {
        if (key !== '1') {
          expect(result.items[key]).toEqual(tree.items[key]);
        }
      });

      // Modified parent should have new children array but same other properties
      expect(result.items['1'].id).toBe(tree.items['1'].id);
      expect(result.items['1'].isOpened).toBe(tree.items['1'].isOpened);
      expect(result.items['1'].customData).toBe(tree.items['1'].customData);
    });
  });

  describe('Mixed types and complex scenarios', () => {
    it('should handle mixed number and string IDs', () => {
      const mixedTree = {
        rootIds: [1],
        items: {
          1: createTreeItem(1, { children: ['a', 2], isOpened: true }),
          2: createTreeItem(2),
          a: createTreeItem('a'),
        },
      };
      const newItem = createTreeItem('new-mixed');

      const result = insertTreeItem({
        tree: mixedTree,
        parentId: 1,
        newItem,
        position: { after: 'a' },
      });

      expect(result.items[1].children).toEqual(['a', 'new-mixed', 2]);
    });

    it('should handle empty tree insertion at root', () => {
      const emptyTree = { rootIds: [], items: {} };
      const newItem = createTreeItem('first-item');

      const result = insertTreeItem({
        tree: emptyTree,
        parentId: null,
        newItem,
        position: 'first',
      });

      expect(result.rootIds).toEqual(['first-item']);
      expect(result.items['first-item']).toEqual(newItem);
    });

    it('should handle complex tree with custom data', () => {
      type CustomData = { label: string; value: number };
      const customTree: TreeData<BasicTreeItem<CustomData>> = {
        rootIds: ['root'],
        items: {
          root: createTreeItem('root', {
            children: ['child1'],
            customData: { label: 'Root', value: 0 },
          }),
          child1: createTreeItem('child1', {
            customData: { label: 'Child 1', value: 1 },
          }),
        },
      };

      const newItem = createTreeItem('new-custom', {
        customData: { label: 'New Item', value: 99 },
      });

      const result = insertTreeItem({
        tree: customTree,
        parentId: 'root',
        newItem,
        position: 'last',
      });

      expect(result.items['root'].children).toEqual(['child1', 'new-custom']);
      expect(result.items['new-custom'].customData).toEqual({ label: 'New Item', value: 99 });
    });
  });
});
