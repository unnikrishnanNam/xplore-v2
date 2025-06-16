import React, { useState, useMemo } from 'react';
import { useAtom } from 'jotai';
import { FilePlus, FolderPlus, Settings } from 'lucide-react';
import { filesAtom, selectedFilesAtom, currentPathAtom, fileViewModeAtom, fileSortModeAtom, fileSortOrderAtom } from '@/store/atoms';
import { cn } from '@/lib/utils';
import Toolbar from './Toolbar';
import { FilledFile, FilledFolder } from './Icons';
import CreateFileDialog from './CreateFileDialog';

const FileExplorer = () => {
  const [files, setFiles] = useAtom(filesAtom);
  const [selectedFiles, setSelectedFiles] = useAtom(selectedFilesAtom);
  const [currentPath] = useAtom(currentPathAtom);
  const [viewMode] = useAtom(fileViewModeAtom);
  const [sortMode] = useAtom(fileSortModeAtom);
  const [sortOrder] = useAtom(fileSortOrderAtom);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId?: string } | null>(null);
  const [createDialog, setCreateDialog] = useState<{ open: boolean; type: 'file' | 'folder' } | null>(null);

  const sortedFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      let comparison = 0;
      
      if (sortMode === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortMode === 'size') {
        const aSize = a.size || 0;
        const bSize = b.size || 0;
        comparison = aSize - bSize;
      } else if (sortMode === 'modified') {
        comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Always put folders first
    return sorted.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return 0;
    });
  }, [files, sortMode, sortOrder]);

  const handleFileClick = (fileId: string, event: React.MouseEvent) => {
    // Close any open context menu
    setContextMenu(null);
    
    if (event.ctrlKey || event.metaKey) {
      setSelectedFiles(prev => 
        prev.includes(fileId) 
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      );
    } else {
      setSelectedFiles([fileId]);
    }
  };

  const handleFileDoubleClick = (file: any) => {
    if (file.type === 'folder') {
      console.log('Opening folder:', file.name);
    } else {
      console.log('Opening file:', file.name);
    }
  };

  const handleRightClick = (event: React.MouseEvent, fileId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Right click detected:', { fileId, hasFileId: !!fileId });
    
    // Select the file if it's not already selected and it's a file/folder right-click
    if (fileId && !selectedFiles.includes(fileId)) {
      setSelectedFiles([fileId]);
    }
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      fileId: fileId // This will be undefined for empty space clicks
    });
  };

  const handleEmptyAreaClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setSelectedFiles([]);
      setContextMenu(null);
    }
  };

  const handleCreateFile = (name: string) => {
    const newFile = {
      id: Date.now().toString(),
      name,
      type: 'file' as const,
      size: 0,
      modified: new Date(),
      path: `${currentPath}/${name}`
    };
    setFiles(prev => [...prev, newFile]);
  };

  const handleCreateFolder = (name: string) => {
    const newFolder = {
      id: Date.now().toString(),
      name,
      type: 'folder' as const,
      modified: new Date(),
      path: `${currentPath}/${name}`
    };
    setFiles(prev => [...prev, newFolder]);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const ContextMenu = () => {
    if (!contextMenu) return null;

    const isFileOrFolder = !!contextMenu.fileId;
    console.log('Rendering context menu:', { isFileOrFolder, fileId: contextMenu.fileId });

    return (
      <>
        <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
        <div 
          className="fixed z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-2 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {isFileOrFolder ? (
            <>
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                Open
              </button>
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                Open in New Tab
              </button>
              <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                Copy
              </button>
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                Cut
              </button>
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                Rename
              </button>
              <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                Delete
              </button>
            </>
          ) : (
            <>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 flex items-center"
                onClick={() => {
                  setCreateDialog({ open: true, type: 'file' });
                  closeContextMenu();
                }}
              >
                <FilePlus className="w-4 h-4 mr-2" />
                Create File
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 flex items-center"
                onClick={() => {
                  setCreateDialog({ open: true, type: 'folder' });
                  closeContextMenu();
                }}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Create Folder
              </button>
              <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                Paste
              </button>
              <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Properties
              </button>
            </>
          )}
        </div>
      </>
    );
  };

  if (viewMode === 'grid') {
    return (
      <div className="flex-1 bg-white dark:bg-neutral-950 overflow-hidden flex flex-col">
        <Toolbar />
        
        <div 
          className="overflow-auto flex-1 p-4" 
          onClick={handleEmptyAreaClick}
          onContextMenu={(e) => handleRightClick(e)}
        >
          <div className="grid grid-cols-6 gap-4">
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900",
                  selectedFiles.includes(file.id) && "bg-neutral-200 dark:bg-neutral-800"
                )}
                onClick={(e) => handleFileClick(file.id, e)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                onContextMenu={(e) => handleRightClick(e, file.id)}
              >
                <div className="mb-2">
                  {file.type === 'folder' ? (
                    <FilledFolder className="w-12 h-12" color="text-blue-500" />
                  ) : (
                    <FilledFile className="w-12 h-12" color="text-neutral-500" />
                  )}
                </div>
                <span className="text-sm text-neutral-900 dark:text-neutral-100 text-center truncate w-full">
                  {file.name}
                </span>
                {file.type === 'file' && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatFileSize(file.size)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <ContextMenu />
        
        {createDialog && (
          <CreateFileDialog
            open={createDialog.open}
            onOpenChange={(open) => setCreateDialog(open ? createDialog : null)}
            onConfirm={createDialog.type === 'file' ? handleCreateFile : handleCreateFolder}
            type={createDialog.type}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-neutral-950 overflow-hidden flex flex-col">
      <Toolbar />

      <div 
        className="overflow-auto flex-1" 
        onClick={handleEmptyAreaClick}
        onContextMenu={(e) => handleRightClick(e)}
      >
        <table className="w-full">
          <thead className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                Size
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                Modified
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {sortedFiles.map((file) => (
              <tr
                key={file.id}
                className={cn(
                  "hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer transition-colors",
                  selectedFiles.includes(file.id) && "bg-neutral-200 dark:bg-neutral-800"
                )}
                onClick={(e) => handleFileClick(file.id, e)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                onContextMenu={(e) => handleRightClick(e, file.id)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    {file.type === 'folder' ? (
                      <FilledFolder className="w-4 h-4" color="text-blue-500" />
                    ) : (
                      <FilledFile className="w-4 h-4" color="text-neutral-500" />
                    )}
                    <span className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {file.type === 'file' ? formatFileSize(file.size) : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {formatDate(file.modified)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ContextMenu />
      
      {createDialog && (
        <CreateFileDialog
          open={createDialog.open}
          onOpenChange={(open) => setCreateDialog(open ? createDialog : null)}
          onConfirm={createDialog.type === 'file' ? handleCreateFile : handleCreateFolder}
          type={createDialog.type}
        />
      )}
    </div>
  );
};

export default FileExplorer;
