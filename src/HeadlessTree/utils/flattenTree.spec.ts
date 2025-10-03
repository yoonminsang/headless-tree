import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { flattenTree } from './flattenTree';
import type { BasicTreeItem, TreeData } from '../types';
import * as logModule from '../../internal/logError';

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
      const result = flattenTree(tree);

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

      const result = flattenTree(tree);
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

      const result = flattenTree(tree);
      expect(result.map((item) => item.depth)).toEqual([0, 1, 2, 3, 4]);
    });

    it('establishes correct parentId', () => {
      const tree = createBasicTree();
      const result = flattenTree(tree);

      expect(result[0].parentId).toBeNull();
      expect(result[1].parentId).toBe('1');
      expect(result[2].parentId).toBe('3');
      expect(result[3].parentId).toBeNull();
    });

    it('handles empty tree', () => {
      const result = flattenTree({ rootIds: [], items: {} });
      expect(result).toEqual([]);
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

      const result = flattenTree(tree);
      expect(result).toHaveLength(1);
    });

    it('marks last item at each depth level', () => {
      const tree = createBasicTree();
      const result = flattenTree(tree);

      expect(result[0].isLastTreeInSameDepth).toBe(false);
      expect(result[1].isLastTreeInSameDepth).toBe(true);
      expect(result[2].isLastTreeInSameDepth).toBe(true);
    });

    it('builds depth completion table for tree line rendering', () => {
      const tree = createBasicTree();
      const result = flattenTree(tree);

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

      const result = flattenTree(tree);

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

      const result = flattenTree(tree);
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

      const result = flattenTree(tree);
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

      const result = flattenTree(tree);
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

      const result = flattenTree(tree);
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

      const result = flattenTree(tree);
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

      const result = flattenTree(tree);
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

      const result = flattenTree(tree);
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

      const result = flattenTree(tree);
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

      const result = flattenTree(tree);
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

      expect(() => flattenTree(tree)).not.toThrow();
      const result = flattenTree(tree);
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

      const startTime = performance.now();
      const result = flattenTree(tree);
      const endTime = performance.now();

      expect(result).toHaveLength(NODE_COUNT + 1);
      // NOTE: 500ms is a reasonable timeout for this test. But it's not guaranteed.
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
