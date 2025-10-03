import { describe, expect, it } from 'vitest';
import { buildChildrenIndexMap } from './buildChildrenIndexMap';
import type { BasicTreeItem, TreeData } from '../types';

describe('buildChildrenIndexMap', () => {
  it('should return index map for root items', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: ['1', '2', '3'],
      items: {
        '1': { id: '1', children: [], customData: {} },
        '2': { id: '2', children: [], customData: {} },
        '3': { id: '3', children: [], customData: {} },
      },
    };

    const indexMap = buildChildrenIndexMap(tree);

    const rootIndexes = indexMap.get(null);
    expect(rootIndexes?.get('1')).toBe(0);
    expect(rootIndexes?.get('2')).toBe(1);
    expect(rootIndexes?.get('3')).toBe(2);
  });

  it('should return index map for child items', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: ['1'],
      items: {
        '1': { id: '1', children: ['2', '3', '4'], customData: {} },
        '2': { id: '2', children: ['5'], customData: {} },
        '3': { id: '3', children: [], customData: {} },
        '4': { id: '4', children: [], customData: {} },
        '5': { id: '5', children: [], customData: {} },
      },
    };

    const indexMap = buildChildrenIndexMap(tree);

    const rootIndexes = indexMap.get(null);
    expect(rootIndexes?.get('1')).toBe(0);

    const parent1Indexes = indexMap.get('1');
    expect(parent1Indexes?.get('2')).toBe(0);
    expect(parent1Indexes?.get('3')).toBe(1);
    expect(parent1Indexes?.get('4')).toBe(2);

    const parent2Indexes = indexMap.get('2');
    expect(parent2Indexes?.get('5')).toBe(0);
  });

  it('should handle empty tree', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: [],
      items: {},
    };

    const indexMap = buildChildrenIndexMap(tree);

    const rootIndexes = indexMap.get(null);
    expect(rootIndexes?.size).toBe(0);
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

    const indexMap = buildChildrenIndexMap(tree);

    // Root level
    const rootIndexes = indexMap.get(null);
    expect(rootIndexes?.get('a')).toBe(0);
    expect(rootIndexes?.get('b')).toBe(1);

    // First level children
    const parentAIndexes = indexMap.get('a');
    expect(parentAIndexes?.get('a1')).toBe(0);
    expect(parentAIndexes?.get('a2')).toBe(1);

    const parentBIndexes = indexMap.get('b');
    expect(parentBIndexes?.get('b1')).toBe(0);

    // Second level children
    const parentA1Indexes = indexMap.get('a1');
    expect(parentA1Indexes?.get('a1-1')).toBe(0);
    expect(parentA1Indexes?.get('a1-2')).toBe(1);

    const parentB1Indexes = indexMap.get('b1');
    expect(parentB1Indexes?.get('b1-1')).toBe(0);
  });

  it('should handle items with no children', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: ['1'],
      items: {
        '1': { id: '1', children: ['2', '3'], customData: {} },
        '2': { id: '2', children: [], customData: {} },
        '3': { id: '3', children: [], customData: {} },
      },
    };

    const indexMap = buildChildrenIndexMap(tree);

    const parent2Indexes = indexMap.get('2');
    expect(parent2Indexes?.size).toBe(0);

    const parent3Indexes = indexMap.get('3');
    expect(parent3Indexes?.size).toBe(0);
  });

  it('should work with numeric IDs', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: [1, 2],
      items: {
        1: { id: 1, children: [3, 4], customData: {} },
        2: { id: 2, children: [5], customData: {} },
        3: { id: 3, children: [], customData: {} },
        4: { id: 4, children: [], customData: {} },
        5: { id: 5, children: [], customData: {} },
      },
    };

    const indexMap = buildChildrenIndexMap(tree);

    const rootIndexes = indexMap.get(null);
    expect(rootIndexes?.get(1)).toBe(0);
    expect(rootIndexes?.get(2)).toBe(1);

    const parent1Indexes = indexMap.get(1);
    expect(parent1Indexes?.get(3)).toBe(0);
    expect(parent1Indexes?.get(4)).toBe(1);

    const parent2Indexes = indexMap.get(2);
    expect(parent2Indexes?.get(5)).toBe(0);
  });

  it('should maintain correct indexes when children have large gaps in IDs', () => {
    const tree: TreeData<BasicTreeItem> = {
      rootIds: ['100', '200', '300'],
      items: {
        '100': { id: '100', children: ['101', '105', '110'], customData: {} },
        '200': { id: '200', children: [], customData: {} },
        '300': { id: '300', children: [], customData: {} },
        '101': { id: '101', children: [], customData: {} },
        '105': { id: '105', children: [], customData: {} },
        '110': { id: '110', children: [], customData: {} },
      },
    };

    const indexMap = buildChildrenIndexMap(tree);

    const rootIndexes = indexMap.get(null);
    expect(rootIndexes?.get('100')).toBe(0);
    expect(rootIndexes?.get('200')).toBe(1);
    expect(rootIndexes?.get('300')).toBe(2);

    const parent100Indexes = indexMap.get('100');
    expect(parent100Indexes?.get('101')).toBe(0);
    expect(parent100Indexes?.get('105')).toBe(1);
    expect(parent100Indexes?.get('110')).toBe(2);
  });
});
