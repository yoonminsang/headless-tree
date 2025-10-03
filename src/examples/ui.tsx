import React from 'react';
import type { BasicTreeItem } from '../HeadlessTree';

const getFileIcon = (type: 'file' | 'folder', isOpened?: boolean) => {
  if (type === 'folder') {
    return isOpened ? '📂' : '📁';
  }
  return '📄';
};

const getToggleIcon = (hasChildren: boolean, isOpened?: boolean) => {
  if (!hasChildren) return '•';
  return isOpened ? '▼' : '▶';
};

export const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}> = ({ onClick, children, variant = 'primary' }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 12px',
      backgroundColor: variant === 'secondary' ? '#6c757d' : '#007acc',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
    }}
  >
    {children}
  </button>
);

export const ControlsPanel: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div
    style={{
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: '#f5f5f5',
      borderRadius: '6px',
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}
  >
    {children}
  </div>
);

export const TreeContainer: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      border: '1px solid #ddd',
      borderRadius: '6px',
      backgroundColor: 'white',
      minHeight: '200px',
      ...style,
    }}
  >
    {children}
  </div>
);

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
}

export const TreeItemRenderer: React.FC<{
  item: BasicTreeItem<FileItem>;
  depth: number;
  toggleOpenState: () => void;
  showSize?: boolean;
  iconType?: 'emoji' | 'symbol';
}> = ({ item, depth, toggleOpenState, showSize = true, iconType = 'emoji' }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '4px 8px',
      borderBottom: '1px solid #f0f0f0',
      minHeight: '32px',
      backgroundColor: 'white',
      paddingLeft: depth * 20 + 8,
    }}
  >
    <button
      onClick={toggleOpenState}
      style={{
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
      }}
      title={item.children.length > 0 ? (item.isOpened ? 'Collapse' : 'Expand') : 'File'}
    >
      {iconType === 'emoji'
        ? getFileIcon(item.customData.type, item.isOpened)
        : getToggleIcon(item.children.length > 0, item.isOpened)}
    </button>
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        color: '#333',
      }}
    >
      {item.customData.name}
      {showSize && item.customData.size && (
        <small
          style={{
            color: '#666',
            fontSize: '12px',
            marginLeft: '8px',
          }}
        >
          ({item.customData.size.toLocaleString()} bytes)
        </small>
      )}
    </span>
  </div>
);
