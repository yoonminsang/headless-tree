import { describe, expect, it } from 'vitest';
import { buildParentMap } from './buildParentMap';
import type { BasicTreeItem, TreeData } from '../types';

describe('buildParentMap', () => {
  it('should return null for root items', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: ['1', '2'],
      items: {
        '1': { id: '1', children: [], customData: {} },
        '2': { id: '2', children: [], customData: {} },
      },
    };

    const parentMap = buildParentMap(tree);

    expect(parentMap.get('1')).toBe(null);
    expect(parentMap.get('2')).toBe(null);
  });

  it('should return parent id for child items', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: ['1'],
      items: {
        '1': { id: '1', children: ['2', '3'], customData: {} },
        '2': { id: '2', children: ['4'], customData: {} },
        '3': { id: '3', children: [], customData: {} },
        '4': { id: '4', children: [], customData: {} },
      },
    };

    const parentMap = buildParentMap(tree);

    expect(parentMap.get('1')).toBe(null);
    expect(parentMap.get('2')).toBe('1');
    expect(parentMap.get('3')).toBe('1');
    expect(parentMap.get('4')).toBe('2');
  });

  it('should handle empty tree', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: [],
      items: {},
    };

    const parentMap = buildParentMap(tree);

    expect(parentMap.size).toBe(0);
  });

  it('should handle complex nested structure', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: ['a', 'b'],
      items: {
        a: { id: 'a', children: ['a1', 'a2'], customData: {} },
        b: { id: 'b', children: ['b1'], customData: {} },
        a1: { id: 'a1', children: ['a1-1', 'a1-2'], customData: {} },
        a2: { id: 'a2', children: [], customData: {} },
        b1: { id: 'b1', children: ['b1-1'], customData: {} },
        'a1-1': { id: 'a1-1', children: [], customData: {} },
        'a1-2': { id: 'a1-2', children: [], customData: {} },
        'b1-1': { id: 'b1-1', children: [], customData: {} },
      },
    };

    const parentMap = buildParentMap(tree);

    expect(parentMap.get('a')).toBe(null);
    expect(parentMap.get('b')).toBe(null);
    expect(parentMap.get('a1')).toBe('a');
    expect(parentMap.get('a2')).toBe('a');
    expect(parentMap.get('b1')).toBe('b');
    expect(parentMap.get('a1-1')).toBe('a1');
    expect(parentMap.get('a1-2')).toBe('a1');
    expect(parentMap.get('b1-1')).toBe('b1');
  });

  it('should work with numeric IDs', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: [1, 2],
      items: {
        1: { id: 1, children: [3, 4], customData: {} },
        2: { id: 2, children: [5], customData: {} },
        3: { id: 3, children: [6], customData: {} },
        4: { id: 4, children: [], customData: {} },
        5: { id: 5, children: [], customData: {} },
        6: { id: 6, children: [], customData: {} },
      },
    };

    const parentMap = buildParentMap(tree);

    expect(parentMap.get(1)).toBe(null);
    expect(parentMap.get(2)).toBe(null);
    expect(parentMap.get(3)).toBe(1);
    expect(parentMap.get(4)).toBe(1);
    expect(parentMap.get(5)).toBe(2);
    expect(parentMap.get(6)).toBe(3);
  });
});
