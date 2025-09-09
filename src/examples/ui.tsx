import React from 'react';
import type { BasicTreeItem } from '../HeadlessTree';

// Common styles
export const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
  },
  controlsPanel: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  button: {
    padding: '6px 12px',
    backgroundColor: '#007acc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
  },
  treeContainer: {
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    minHeight: '200px',
  },
  treeItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderBottom: '1px solid #f0f0f0',
    minHeight: '32px',
    backgroundColor: 'white',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '8px',
    padding: '4px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
  },
  itemContent: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#333',
  },
  fileSize: {
    color: '#666',
    fontSize: '12px',
    marginLeft: '8px',
  },
  stats: {
    color: '#666',
    fontSize: '13px',
    fontWeight: 'normal' as const,
  },
};

// File/folder icons
export const getFileIcon = (type: 'file' | 'folder', isOpened?: boolean) => {
  if (type === 'folder') {
    return isOpened ? '📂' : '📁';
  }
  return '📄';
};

export const getToggleIcon = (hasChildren: boolean, isOpened?: boolean) => {
  if (!hasChildren) return '•';
  return isOpened ? '▼' : '▶';
};

// Common interfaces
export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
}

// Reusable components
export const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  style?: React.CSSProperties;
}> = ({ onClick, children, variant = 'primary', style }) => (
  <button
    onClick={onClick}
    style={{
      ...styles.button,
      ...(variant === 'secondary' && styles.buttonSecondary),
      ...style,
    }}
  >
    {children}
  </button>
);

export const ControlsPanel: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <div style={styles.controlsPanel}>{children}</div>;

export const TreeContainer: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => <div style={{ ...styles.treeContainer, ...style }}>{children}</div>;

export const TreeItemRenderer: React.FC<{
  item: BasicTreeItem<FileItem>;
  depth: number;
  toggleOpenState: () => void;
  showSize?: boolean;
  iconType?: 'emoji' | 'symbol';
}> = ({ item, depth, toggleOpenState, showSize = true, iconType = 'emoji' }) => (
  <div
    style={{
      ...styles.treeItem,
      paddingLeft: depth * 20 + 8,
    }}
  >
    <button
      onClick={toggleOpenState}
      style={styles.toggleButton}
      title={item.children.length > 0 ? (item.isOpened ? 'Collapse' : 'Expand') : 'File'}
    >
      {iconType === 'emoji'
        ? getFileIcon(item.customData.type, item.isOpened)
        : getToggleIcon(item.children.length > 0, item.isOpened)}
    </button>
    <span style={styles.itemContent}>
      {item.customData.name}
      {showSize && item.customData.size && (
        <small style={styles.fileSize}>({item.customData.size.toLocaleString()} bytes)</small>
      )}
    </span>
  </div>
);
