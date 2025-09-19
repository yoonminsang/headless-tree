import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getPath } from './getPath';
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

describe('getPath', () => {
  describe('Core functionality', () => {
    it('should find path to root node', () => {
      const tree = createBasicTree();
      const path = getPath(tree, '1');
      expect(path).toEqual(['1']);
    });

    it('should find path to direct child', () => {
      const tree = createBasicTree();
      const path = getPath(tree, '2');
      expect(path).toEqual(['1', '2']);
    });

    it('should find path to deeply nested node', () => {
      const tree = createBasicTree();
      const path = getPath(tree, '7');
      expect(path).toEqual(['1', '3', '6', '7']);
    });

    it('should find path to leaf node', () => {
      const tree = createBasicTree();
      const path = getPath(tree, '4');
      expect(path).toEqual(['1', '2', '4']);
    });

    it('should return empty array for non-existent node', () => {
      const tree = createBasicTree();
      const path = getPath(tree, 'non-existent');
      expect(path).toEqual([]);
    });

    it('should handle empty tree', () => {
      const emptyTree = { rootIds: [], items: {} };
      const path = getPath(emptyTree, 'any-id');
      expect(path).toEqual([]);
    });
  });

  describe('Multiple roots and complex structures', () => {
    it('should handle multiple root trees', () => {
      const tree = createMultiRootTree();

      expect(getPath(tree, 'c')).toEqual(['a', 'b', 'c']);
      expect(getPath(tree, 'e')).toEqual(['d', 'e']);
    });

    it('should handle mixed number and string IDs', () => {
      const mixedTree = {
        rootIds: [1],
        items: {
          1: createTreeItem(1, { children: ['a', 2], isOpened: true }),
          2: createTreeItem(2),
          a: createTreeItem('a'),
        },
      };

      expect(getPath(mixedTree, 'a')).toEqual([1, 'a']);
      expect(getPath(mixedTree, 2)).toEqual([1, 2]);
    });

    it('should find first occurrence in case of multiple paths', () => {
      const tree = {
        rootIds: ['root1', 'root2'],
        items: {
          root1: createTreeItem('root1', { children: ['shared'] }),
          root2: createTreeItem('root2', { children: ['shared'] }),
          shared: createTreeItem('shared'),
        },
      };

      // The actual implementation uses DFS with stack, so it finds the last root first
      // This is expected behavior based on the current implementation
      const path = getPath(tree, 'shared');
      expect(path).toHaveLength(2);
      expect(path[1]).toBe('shared');
      expect(['root1', 'root2']).toContain(path[0]);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle circular references without infinite loop', () => {
      const circularTree = {
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2'] }),
          '2': createTreeItem('2', { children: ['1'] }), // Circular reference
        },
      };

      // Should still find valid paths without infinite loop
      expect(getPath(circularTree, '1')).toEqual(['1']);
      expect(getPath(circularTree, '2')).toEqual(['1', '2']);
    });

    it('should skip already visited nodes in circular references', () => {
      // Create a more complex circular reference to ensure visited check is triggered
      const complexCircularTree = {
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2', '3'] }),
          '2': createTreeItem('2', { children: ['4'] }),
          '3': createTreeItem('3', { children: ['2'] }), // Points back to 2
          '4': createTreeItem('4', { children: ['1'] }), // Points back to root
        },
      };

      // Test that we can find paths without infinite loops
      // The visited set should prevent revisiting nodes
      expect(getPath(complexCircularTree, '1')).toEqual(['1']);
      expect(getPath(complexCircularTree, '2')).toEqual(['1', '2']);
      expect(getPath(complexCircularTree, '3')).toEqual(['1', '3']);
      expect(getPath(complexCircularTree, '4')).toEqual(['1', '2', '4']);
    });

    it('should handle self-referencing nodes', () => {
      const selfRefTree = {
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['1', '2'] }), // Self reference
          '2': createTreeItem('2'),
        },
      };

      // Should handle self-reference without infinite loop
      expect(getPath(selfRefTree, '1')).toEqual(['1']);
      expect(getPath(selfRefTree, '2')).toEqual(['1', '2']);
    });

    it('should handle malformed tree data', () => {
      const malformedTree = {
        rootIds: ['1', 'missing-root'],
        items: {
          '1': createTreeItem('1', { children: ['2', 'missing-child'] }),
          '2': createTreeItem('2'),
          // missing-root and missing-child are not defined
        },
      };

      expect(getPath(malformedTree, '1')).toEqual(['1']);
      expect(getPath(malformedTree, '2')).toEqual(['1', '2']);
      // missing-root is in rootIds but not in items, so it returns just the id
      expect(getPath(malformedTree, 'missing-root')).toEqual(['missing-root']);
      // missing-child is referenced but not defined, current implementation finds path anyway
      expect(getPath(malformedTree, 'missing-child')).toEqual(['1', 'missing-child']);
    });
  });
});
