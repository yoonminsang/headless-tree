import { describe, expect, it } from 'vitest';
import { canMoveItem } from './canMoveItem';
import type { BasicTreeItem, TreeData } from '../types';

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
 * Test tree structure:
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
    '1': createTreeItem('1', { children: ['2', '3'] }),
    '2': createTreeItem('2', { children: ['4', '5'] }),
    '3': createTreeItem('3', { children: ['6'] }),
    '4': createTreeItem('4'),
    '5': createTreeItem('5'),
    '6': createTreeItem('6', { children: ['7'] }),
    '7': createTreeItem('7'),
  },
});

describe('canMoveItem', () => {
  describe('Valid moves', () => {
    it('should allow moving between siblings', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, '2', '3')).toBe(true);
      expect(canMoveItem(tree, '3', '2')).toBe(true);
      expect(canMoveItem(tree, '4', '5')).toBe(true);
    });

    it('should allow moving to parent', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, '2', '1')).toBe(true);
      expect(canMoveItem(tree, '4', '2')).toBe(true);
      expect(canMoveItem(tree, '7', '6')).toBe(true);
    });

    it('should allow moving to unrelated items', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, '2', '6')).toBe(true);
      expect(canMoveItem(tree, '4', '3')).toBe(true);
      expect(canMoveItem(tree, '5', '7')).toBe(true);
    });

    it('should allow moving leaf nodes anywhere except their ancestors', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, '7', '4')).toBe(true);
      expect(canMoveItem(tree, '7', '5')).toBe(true);
      expect(canMoveItem(tree, '4', '7')).toBe(true);
    });
  });

  describe('Invalid moves', () => {
    it('should prevent moving to itself', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, '1', '1')).toBe(false);
      expect(canMoveItem(tree, '2', '2')).toBe(false);
      expect(canMoveItem(tree, '7', '7')).toBe(false);
    });

    it('should prevent moving to direct children', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, '1', '2')).toBe(false);
      expect(canMoveItem(tree, '1', '3')).toBe(false);
      expect(canMoveItem(tree, '2', '4')).toBe(false);
      expect(canMoveItem(tree, '6', '7')).toBe(false);
    });

    it('should prevent moving to grandchildren', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, '1', '4')).toBe(false);
      expect(canMoveItem(tree, '1', '5')).toBe(false);
      expect(canMoveItem(tree, '1', '6')).toBe(false);
    });

    it('should prevent moving to deeply nested descendants', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, '1', '7')).toBe(false);
      expect(canMoveItem(tree, '3', '7')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle non-existent source', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, 'non-existent', '2')).toBe(true);
    });

    it('should handle non-existent target', () => {
      const tree = createBasicTree();
      expect(canMoveItem(tree, '1', 'non-existent')).toBe(true);
    });

    it('should handle numeric IDs', () => {
      const tree: TreeData<BasicTreeItem> = {
        rootIds: [1],
        items: {
          1: createTreeItem(1, { children: [2, 3] }),
          2: createTreeItem(2, { children: [4] }),
          3: createTreeItem(3),
          4: createTreeItem(4),
        },
      };

      expect(canMoveItem(tree, 1, 4)).toBe(false); // Cannot move to descendant
      expect(canMoveItem(tree, 2, 3)).toBe(true); // Can move to sibling
      expect(canMoveItem(tree, 4, 3)).toBe(true); // Can move to unrelated
    });
  });

  describe('Complex tree structures', () => {
    it('should handle multi-root trees', () => {
      const tree: TreeData<BasicTreeItem> = {
        rootIds: ['a', 'd'],
        items: {
          a: createTreeItem('a', { children: ['b'] }),
          b: createTreeItem('b', { children: ['c'] }),
          c: createTreeItem('c'),
          d: createTreeItem('d', { children: ['e'] }),
          e: createTreeItem('e'),
        },
      };

      expect(canMoveItem(tree, 'a', 'c')).toBe(false); // c is descendant of a
      expect(canMoveItem(tree, 'a', 'e')).toBe(true); // e is in different tree
      expect(canMoveItem(tree, 'd', 'c')).toBe(true); // c is in different tree
    });

    it('should prevent circular moves in deep trees', () => {
      const tree: TreeData<BasicTreeItem> = {
        rootIds: ['1'],
        items: {
          '1': createTreeItem('1', { children: ['2'] }),
          '2': createTreeItem('2', { children: ['3'] }),
          '3': createTreeItem('3', { children: ['4'] }),
          '4': createTreeItem('4', { children: ['5'] }),
          '5': createTreeItem('5'),
        },
      };

      expect(canMoveItem(tree, '1', '5')).toBe(false);
      expect(canMoveItem(tree, '2', '5')).toBe(false);
      expect(canMoveItem(tree, '3', '5')).toBe(false);
      expect(canMoveItem(tree, '5', '1')).toBe(true); // Can move up
    });
  });

  describe('Real-world scenarios', () => {
    it('should validate file system-like moves', () => {
      const tree: TreeData<BasicTreeItem> = {
        rootIds: ['Documents', 'Pictures'],
        items: {
          Documents: createTreeItem('Documents', { children: ['Work', 'Personal'] }),
          Work: createTreeItem('Work', { children: ['Projects'] }),
          Projects: createTreeItem('Projects'),
          Personal: createTreeItem('Personal'),
          Pictures: createTreeItem('Pictures', { children: ['Vacation'] }),
          Vacation: createTreeItem('Vacation'),
        },
      };

      // Valid moves
      expect(canMoveItem(tree, 'Work', 'Personal')).toBe(true); // Move folder to sibling
      expect(canMoveItem(tree, 'Projects', 'Pictures')).toBe(true); // Move to different root
      expect(canMoveItem(tree, 'Vacation', 'Documents')).toBe(true); // Move between roots

      // Invalid moves
      expect(canMoveItem(tree, 'Documents', 'Work')).toBe(false); // Cannot move to child
      expect(canMoveItem(tree, 'Documents', 'Projects')).toBe(false); // Cannot move to grandchild
      expect(canMoveItem(tree, 'Work', 'Work')).toBe(false); // Cannot move to itself
    });
  });
});
