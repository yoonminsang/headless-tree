import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { flattenTree } from './flattenTree';
import type { BasicTreeItem, TreeData } from '../types';
import * as logModule from '../../internal/logError';
import { buildChildrenIndexMap } from './buildChildrenIndexMap';

/**
 * Basic tree structure for testing:
 *
 * ┌─ 1 (opened)
 * │  └─ 3 (opened)
 * │     └─ 4 (closed)
 * └─ 2 (opened)
 */
const createBasicTree = (): TreeData<BasicTreeItem> => ({
  rootIds: ['1', '2'],
  items: {
    '1': { id: '1', children: ['3'], isOpened: true, customData: {} },
    '2': { id: '2', children: [], isOpened: false, customData: {} },
    '3': { id: '3', children: ['4'], isOpened: true, customData: {} },
    '4': { id: '4', children: [], isOpened: false, customData: {} },
  },
});

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

describe('flattenTree', () => {
  describe('Core functionality', () => {
    it('flattens tree structure preserving hierarchy', () => {
      const tree = createBasicTree();
      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);

      expect(result).toHaveLength(4);
      expect(result.map((item) => item.item.id)).toEqual(['1', '3', '4', '2']);
    });

    it('handles mixed string and number IDs', () => {
      const tree = createTree({
        rootIds: [1, 'a'],
        items: {
          1: createTreeItem(1, { children: [2], isOpened: true }),
          2: createTreeItem(2),
          a: createTreeItem('a', { children: ['b'], isOpened: true }),
          b: createTreeItem('b'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result.map((item) => item.item.id)).toEqual([1, 2, 'a', 'b']);
    });

    it('calculates depth correctly for nested structures', () => {
      const tree = createTree({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2'], isOpened: true }),
          '2': createTreeItem('2', { children: ['3'], isOpened: true }),
          '3': createTreeItem('3', { children: ['4'], isOpened: true }),
          '4': createTreeItem('4', { children: ['5'], isOpened: true }),
          '5': createTreeItem('5'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result.map((item) => item.depth)).toEqual([0, 1, 2, 3, 4]);
    });

    it('establishes correct parentId', () => {
      const tree = createBasicTree();
      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);

      expect(result[0].parentId).toBeNull();
      expect(result[1].parentId).toBe('1');
      expect(result[2].parentId).toBe('3');
      expect(result[3].parentId).toBeNull();
    });

    it('handles empty tree', () => {
      const tree = { rootIds: [], items: {} };
      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result).toEqual([]);
    });

    it('calculates flatIndex correctly for flattened tree', () => {
      const tree = createBasicTree();
      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);

      // flatIndex should match the position in the flattened array
      expect(result[0].flatIndex).toBe(0);
      expect(result[1].flatIndex).toBe(1);
      expect(result[2].flatIndex).toBe(2);
      expect(result[3].flatIndex).toBe(3);
    });

    it('calculates childIndex correctly for items in same parent', () => {
      const tree = createTree({
        rootIds: ['1', '2', '3'],
        items: {
          '1': createTreeItem('1', { children: ['4', '5', '6'], isOpened: true }),
          '2': createTreeItem('2'),
          '3': createTreeItem('3'),
          '4': createTreeItem('4'),
          '5': createTreeItem('5'),
          '6': createTreeItem('6'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);

      // Root items: '1', '2', '3' should have childIndex 0, 1, 2
      expect(result.find((item) => item.item.id === '1')?.childIndex).toBe(0);
      expect(result.find((item) => item.item.id === '2')?.childIndex).toBe(1);
      expect(result.find((item) => item.item.id === '3')?.childIndex).toBe(2);

      // Children of '1': '4', '5', '6' should have childIndex 0, 1, 2
      expect(result.find((item) => item.item.id === '4')?.childIndex).toBe(0);
      expect(result.find((item) => item.item.id === '5')?.childIndex).toBe(1);
      expect(result.find((item) => item.item.id === '6')?.childIndex).toBe(2);
    });

    it('maintains correct flatIndex and childIndex in complex nested structure', () => {
      const tree = createTree({
        rootIds: ['1', '2'],
        items: {
          '1': createTreeItem('1', { children: ['3', '4'], isOpened: true }),
          '2': createTreeItem('2', { children: ['5'], isOpened: true }),
          '3': createTreeItem('3', { children: ['6', '7'], isOpened: true }),
          '4': createTreeItem('4'),
          '5': createTreeItem('5'),
          '6': createTreeItem('6'),
          '7': createTreeItem('7'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);

      // Flattened order: 1, 3, 6, 7, 4, 2, 5
      // Verify flatIndex matches array position
      result.forEach((item, index) => {
        expect(item.flatIndex).toBe(index);
      });

      // Verify childIndex for specific items
      expect(result.find((item) => item.item.id === '1')?.childIndex).toBe(0); // First root
      expect(result.find((item) => item.item.id === '2')?.childIndex).toBe(1); // Second root
      expect(result.find((item) => item.item.id === '3')?.childIndex).toBe(0); // First child of '1'
      expect(result.find((item) => item.item.id === '4')?.childIndex).toBe(1); // Second child of '1'
      expect(result.find((item) => item.item.id === '6')?.childIndex).toBe(0); // First child of '3'
      expect(result.find((item) => item.item.id === '7')?.childIndex).toBe(1); // Second child of '3'
    });

    it('calculates flatIndex sequentially even when some branches are collapsed', () => {
      const tree = createTree({
        rootIds: ['1', '2'],
        items: {
          '1': createTreeItem('1', { children: ['3', '4'], isOpened: false }), // Collapsed
          '2': createTreeItem('2', { children: ['5'], isOpened: true }),
          '3': createTreeItem('3'),
          '4': createTreeItem('4'),
          '5': createTreeItem('5'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);

      // Only visible items: 1, 2, 5
      expect(result).toHaveLength(3);
      expect(result[0].flatIndex).toBe(0);
      expect(result[1].flatIndex).toBe(1);
      expect(result[2].flatIndex).toBe(2);

      // childIndex should still be correct
      expect(result[0].childIndex).toBe(0); // '1' is first root
      expect(result[1].childIndex).toBe(1); // '2' is second root
      expect(result[2].childIndex).toBe(0); // '5' is first child of '2'
    });
  });

  describe('Tree expansion state', () => {
    it('respects collapsed state and hides children', () => {
      const tree = createTree({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2'], isOpened: false }),
          '2': createTreeItem('2'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result).toHaveLength(1);
    });

    it('marks last item at each depth level', () => {
      const tree = createBasicTree();
      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);

      expect(result[0].isLastTreeInSameDepth).toBe(false);
      expect(result[1].isLastTreeInSameDepth).toBe(true);
      expect(result[2].isLastTreeInSameDepth).toBe(true);
    });

    it('builds depth completion table for tree line rendering', () => {
      const tree = createBasicTree();
      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);

      expect(result[0].completeDepthHashTable).toEqual({});
      expect(result[1].completeDepthHashTable).toEqual({ 0: true });
      expect(result[2].completeDepthHashTable).toEqual({ 0: true });
      expect(result[3].completeDepthHashTable).toEqual({});
    });

    it('handles complex depth table for multiple branches', () => {
      const tree = createTree({
        rootIds: ['1', '2'],
        items: {
          '1': createTreeItem('1', { children: ['3', '4'], isOpened: true }),
          '2': createTreeItem('2', { children: ['5'], isOpened: true }),
          '3': createTreeItem('3', { children: ['6'], isOpened: true }),
          '4': createTreeItem('4'),
          '5': createTreeItem('5'),
          '6': createTreeItem('6'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);

      expect(result[0].completeDepthHashTable).toEqual({});
      expect(result[1].completeDepthHashTable).toEqual({ 0: true });
      expect(result[2].completeDepthHashTable).toEqual({ 0: true, 1: true });
      expect(result[3].completeDepthHashTable).toEqual({ 0: true });
      expect(result[4].completeDepthHashTable).toEqual({});
      expect(result[5].completeDepthHashTable).toEqual({});
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

    it('logs error and skips missing root items', () => {
      const tree = createTree({
        rootIds: ['1', 'missing-root'],
        items: {
          '1': createTreeItem('1', { isOpened: true }),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result).toHaveLength(1);
      expect(logErrorSpy).toHaveBeenCalledOnce();
    });

    it('logs error for missing child items', () => {
      const tree = createTree({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2'], isOpened: true }),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result).toHaveLength(1);
      expect(logErrorSpy).toHaveBeenCalledOnce();
    });

    it('filters out invalid children and continues processing', () => {
      const tree = createTree({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2', 'non-existent', '3'], isOpened: true }),
          '2': createTreeItem('2'),
          '3': createTreeItem('3'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result.map((item) => item.item.id)).toEqual(['1', '2', '3']);
      expect(logErrorSpy).toHaveBeenCalledOnce();
    });

    it('handles mixed valid and invalid children', () => {
      const tree = createTree({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', {
            children: ['valid1', 'invalid1', 'valid2', 'invalid2', 'valid3'],
            isOpened: true,
          }),
          valid1: createTreeItem('valid1'),
          valid2: createTreeItem('valid2'),
          valid3: createTreeItem('valid3'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result.map((item) => item.item.id)).toEqual(['1', 'valid1', 'valid2', 'valid3']);
      expect(logErrorSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Children processing', () => {
    it('handles leaf nodes correctly', () => {
      const tree = createTree({
        rootIds: ['1', '2'],
        items: {
          '1': createTreeItem('1', { isOpened: true }),
          '2': createTreeItem('2'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result.map((item) => item.item.id)).toEqual(['1', '2']);
    });

    it('preserves children order in flattened output', () => {
      const tree = createTree({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2', '3', '4'], isOpened: true }),
          '2': createTreeItem('2'),
          '3': createTreeItem('3'),
          '4': createTreeItem('4'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result.map((item) => item.item.id)).toEqual(['1', '2', '3', '4']);
    });

    it('preserves original children arrays in items', () => {
      const tree = createTree({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2', '3'], isOpened: true }),
          '2': createTreeItem('2', { children: ['4'], isOpened: true }),
          '3': createTreeItem('3'),
          '4': createTreeItem('4'),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result[0].item.children).toEqual(['2', '3']);
      expect(result[1].item.children).toEqual(['4']);
      expect(result[2].item.children).toEqual([]);
      expect(result[3].item.children).toEqual([]);
    });
  });

  describe('Custom data preservation', () => {
    interface CustomData {
      name: string;
      value: number;
      metadata?: {
        tags: string[];
        config: {
          enabled: boolean;
          settings: {
            theme: string;
            language: string;
          };
        };
      };
    }

    it('preserves simple custom data', () => {
      const tree = createTree<CustomData>({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', {
            children: ['2'],
            isOpened: true,
            customData: { name: 'Root', value: 100 },
          }),
          '2': createTreeItem('2', {
            customData: { name: 'Child', value: 200 },
          }),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result[0].item.customData).toEqual({ name: 'Root', value: 100 });
      expect(result[1].item.customData).toEqual({ name: 'Child', value: 200 });
    });

    it('preserves nested custom data structures', () => {
      const tree = createTree<CustomData>({
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', {
            children: ['2'],
            isOpened: true,
            customData: {
              name: 'Root',
              value: 1,
              metadata: {
                tags: ['important', 'root'],
                config: {
                  enabled: true,
                  settings: { theme: 'dark', language: 'ko' },
                },
              },
            },
          }),
          '2': createTreeItem('2', {
            customData: {
              name: 'Child',
              value: 2,
              metadata: {
                tags: ['child'],
                config: {
                  enabled: false,
                  settings: { theme: 'light', language: 'en' },
                },
              },
            },
          }),
        },
      });

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const result = flattenTree(tree, childrenIndexMap);
      expect(result[0].item.customData.metadata?.config?.settings?.theme).toBe('dark');
      expect(result[1].item.customData.metadata?.config?.settings?.theme).toBe('light');
    });
  });

  describe('Performance', () => {
    it('handles deeply nested trees without stack overflow', () => {
      const DEPTH = 100000;
      const tree: TreeData<BasicTreeItem> = {
        rootIds: ['root'],
        items: {},
      };

      let currentId = 'root';
      for (let i = 0; i < DEPTH; i++) {
        const nextId = `node-${i}`;
        tree.items[currentId] = createTreeItem(currentId, {
          children: [nextId],
          isOpened: true,
        });
        currentId = nextId;
      }
      tree.items[currentId] = createTreeItem(currentId);

      const childrenIndexMap = buildChildrenIndexMap(tree);
      expect(() => flattenTree(tree, childrenIndexMap)).not.toThrow();
      const result = flattenTree(tree, childrenIndexMap);
      expect(result).toHaveLength(DEPTH + 1);
    });

    it('processes large trees efficiently', () => {
      const NODE_COUNT = 100000;
      const tree: TreeData<BasicTreeItem> = {
        rootIds: ['root'],
        items: {
          root: createTreeItem('root', {
            children: [],
            isOpened: true,
          }),
        },
      };

      for (let i = 0; i < NODE_COUNT; i++) {
        const childId = `child-${i}`;
        tree.items.root.children.push(childId);
        tree.items[childId] = createTreeItem(childId);
      }

      const childrenIndexMap = buildChildrenIndexMap(tree);
      const startTime = performance.now();
      const result = flattenTree(tree, childrenIndexMap);
      const endTime = performance.now();

      expect(result).toHaveLength(NODE_COUNT + 1);
      // NOTE: 500ms is a reasonable timeout for this test. But it's not guaranteed.
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
