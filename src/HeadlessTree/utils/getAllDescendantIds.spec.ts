import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getAllDescendantIds } from './getAllDescendantIds';
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

// Mock setup for error logging tests
let logErrorSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(() => {
  logErrorSpy = vi.spyOn(logModule, 'logError').mockImplementation(() => {});
});

afterEach(() => {
  logErrorSpy?.mockRestore();
});

describe('getAllDescendantIds', () => {
  describe('Core functionality', () => {
    it('should return all descendants of root node', () => {
      const tree = createBasicTree();
      const descendants = getAllDescendantIds(tree, '1');
      expect(descendants).toHaveLength(6);
      expect(descendants).toEqual(expect.arrayContaining(['2', '3', '4', '5', '6', '7']));
    });

    it('should return all descendants of intermediate node', () => {
      const tree = createBasicTree();
      const descendants = getAllDescendantIds(tree, '2');
      expect(descendants).toHaveLength(2);
      expect(descendants).toEqual(expect.arrayContaining(['4', '5']));
    });

    it('should return descendants in breadth-first order', () => {
      const tree = createBasicTree();
      const descendants = getAllDescendantIds(tree, '1');
      // BFS order: level by level
      expect(descendants).toEqual(['2', '3', '4', '5', '6', '7']);
    });

    it('should return empty array for leaf node', () => {
      const tree = createBasicTree();
      const descendants = getAllDescendantIds(tree, '4');
      expect(descendants).toEqual([]);
    });

    it('should return empty array for non-existent node', () => {
      const tree = createBasicTree();
      const descendants = getAllDescendantIds(tree, 'non-existent');
      expect(descendants).toEqual([]);
    });

    it('should handle single child chains', () => {
      const tree = createBasicTree();
      const descendants = getAllDescendantIds(tree, '3');
      expect(descendants).toEqual(['6', '7']);
    });
  });

  describe('Complex structures', () => {
    it('should handle complex nested structures', () => {
      const complexTree = {
        rootIds: ['root'],
        items: {
          root: createTreeItem('root', { children: ['a', 'b', 'c'], isOpened: true }),
          a: createTreeItem('a', { children: ['a1', 'a2'], isOpened: true }),
          b: createTreeItem('b', { children: ['b1'], isOpened: true }),
          c: createTreeItem('c'),
          a1: createTreeItem('a1'),
          a2: createTreeItem('a2', { children: ['a2-1'], isOpened: true }),
          b1: createTreeItem('b1'),
          'a2-1': createTreeItem('a2-1'),
        },
      };

      const descendants = getAllDescendantIds(complexTree, 'root');
      expect(descendants).toHaveLength(7);
      expect(descendants).toEqual(['a', 'b', 'c', 'a1', 'a2', 'b1', 'a2-1']);
    });

    it('should handle mixed ID types', () => {
      const mixedTree = {
        rootIds: [1],
        items: {
          1: createTreeItem(1, { children: ['a', 2] }),
          2: createTreeItem(2, { children: [3] }),
          3: createTreeItem(3),
          a: createTreeItem('a', { children: ['b'] }),
          b: createTreeItem('b'),
        },
      };

      const descendants = getAllDescendantIds(mixedTree, 1);
      expect(descendants).toEqual(['a', 2, 'b', 3]);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed children references', () => {
      const malformedTree = {
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2', 'missing', '3'] }),
          '2': createTreeItem('2'),
          '3': createTreeItem('3'),
          // 'missing' is not defined
        },
      };

      // getAllDescendantIds includes all children in the list, regardless of validity
      // This is the current behavior - it doesn't validate existence
      const descendants = getAllDescendantIds(malformedTree, '1');
      expect(descendants).toEqual(['2', 'missing', '3']);
    });

    it('should handle empty tree', () => {
      const emptyTree = { rootIds: [], items: {} };
      expect(getAllDescendantIds(emptyTree, 'any-id')).toEqual([]);
    });
  });
});
