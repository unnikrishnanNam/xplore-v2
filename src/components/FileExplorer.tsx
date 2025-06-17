import React, { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { FilePlus, FolderPlus, Settings } from "lucide-react";
import {
  filesAtom,
  selectedFilesAtom,
  currentPathAtom,
  fileViewModeAtom,
  fileSortModeAtom,
  fileSortOrderAtom,
  showHiddenFilesAtom,
} from "@/store/atoms";
import { cn } from "@/lib/utils";
import Toolbar from "./Toolbar";
import { FilledFile, FilledFolder } from "./Icons";
import CreateFileDialog from "./CreateFileDialog";
import type { FileItem } from "@/store/atoms";

const FileExplorer = () => {
  const [files, setFiles] = useAtom(filesAtom);
  const [selectedFiles, setSelectedFiles] = useAtom(selectedFilesAtom);
  const [currentPath, setCurrentPath] = useAtom(currentPathAtom);
  const [viewMode] = useAtom(fileViewModeAtom);
  const [sortMode] = useAtom(fileSortModeAtom);
  const [sortOrder] = useAtom(fileSortOrderAtom);
  const [showHiddenFiles] = useAtom(showHiddenFilesAtom);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    fileId?: string;
  } | null>(null);
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    type: "file" | "folder";
  } | null>(null);

  const sortedFiles = useMemo(() => {
    // Filter out hidden files if showHiddenFiles is false
    let filteredFiles = [...files];
    if (!showHiddenFiles) {
      filteredFiles = filteredFiles.filter(
        (file) => !file.name.startsWith(".")
      );
    }

    const sorted = filteredFiles.sort((a, b) => {
      let comparison = 0;

      if (sortMode === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortMode === "size") {
        const aSize = a.size || 0;
        const bSize = b.size || 0;
        comparison = aSize - bSize;
      } else if (sortMode === "modified") {
        comparison =
          new Date(a.modified).getTime() - new Date(b.modified).getTime();
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Always put folders first
    return sorted.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
      return 0;
    });
  }, [files, sortMode, sortOrder, showHiddenFiles]);

  const handleFileClick = (fileId: string, event: React.MouseEvent) => {
    // Close any open context menu
    setContextMenu(null);

    if (event.ctrlKey || event.metaKey) {
      setSelectedFiles((prev) =>
        prev.includes(fileId)
          ? prev.filter((id) => id !== fileId)
          : [...prev, fileId]
      );
    } else {
      setSelectedFiles([fileId]);
    }
  };

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.type === "folder") {
      setCurrentPath(file.path);
    } else {
      // Open file with default app using electronAPI
      if (
        typeof window !== "undefined" &&
        window.electronAPI &&
        typeof window.electronAPI.openFile === "function"
      ) {
        window.electronAPI.openFile(file.path);
      } else {
        console.log("Opening file:", file.name);
      }
    }
  };

  const handleRightClick = (event: React.MouseEvent, fileId?: string) => {
    event.preventDefault();
    event.stopPropagation();

    console.log("Right click detected:", { fileId, hasFileId: !!fileId });

    // Select the file if it's not already selected and it's a file/folder right-click
    if (fileId && !selectedFiles.includes(fileId)) {
      setSelectedFiles([fileId]);
    }

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      fileId: fileId, // This will be undefined for empty space clicks
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
      type: "file" as const,
      size: 0,
      modified: new Date(),
      path: `${currentPath}/${name}`,
    };
    setFiles((prev) => [...prev, newFile]);
  };

  const handleCreateFolder = (name: string) => {
    const newFolder = {
      id: Date.now().toString(),
      name,
      type: "folder" as const,
      modified: new Date(),
      path: `${currentPath}/${name}`,
    };
    setFiles((prev) => [...prev, newFolder]);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const ContextMenu = () => {
    if (!contextMenu) return null;

    const isFileOrFolder = !!contextMenu.fileId;
    console.log("Rendering context menu:", {
      isFileOrFolder,
      fileId: contextMenu.fileId,
    });

    return (
      <>
        <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
        <div
          className="fixed z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg min-w-48 overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {isFileOrFolder ? (
            <>
              <button className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Open
              </button>
              <button className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Open in New Tab
              </button>
              <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-2 my-1" />
              <button className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Copy
              </button>
              <button className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Cut
              </button>
              <button className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Rename
              </button>
              <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-2 my-1" />
              <button className="w-full group flex items-center text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                onClick={() => {
                  setCreateDialog({ open: true, type: "file" });
                  closeContextMenu();
                }}
              >
                <FilePlus className="w-4 h-4 mr-2 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
                Create File
              </button>
              <button
                className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                onClick={() => {
                  setCreateDialog({ open: true, type: "folder" });
                  closeContextMenu();
                }}
              >
                <FolderPlus className="w-4 h-4 mr-2 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
                Create Folder
              </button>
              <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-2 my-1" />
              <button className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Paste
              </button>
              <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-2 my-1" />
              <button className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                <Settings className="w-4 h-4 mr-2 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
                Properties
              </button>
            </>
          )}
        </div>
      </>
    );
  };

  // Fetch directory contents when currentPath changes
  const electronAPI = window.electronAPI as {
    listDirectory?: (
      dirPath: string
    ) => Promise<{ success: boolean; files: FileItem[]; error?: string }>;
  };
  useEffect(() => {
    // Only fetch from electronAPI if available (i.e., running in Electron)
    if (
      typeof window !== "undefined" &&
      "electronAPI" in window &&
      electronAPI &&
      electronAPI.listDirectory
    ) {
      electronAPI
        .listDirectory(currentPath)
        .then(
          (result: { success: boolean; files: FileItem[]; error?: string }) => {
            if (result.success) {
              setFiles(result.files);
            } else {
              setFiles([]);
            }
          }
        );
    }
    // else: fallback to mock data (already in filesAtom)
  }, [currentPath, setFiles, electronAPI]);

  if (viewMode === "grid") {
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
                  selectedFiles.includes(file.id) &&
                    "bg-neutral-200 dark:bg-neutral-800"
                )}
                onClick={(e) => handleFileClick(file.id, e)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                onContextMenu={(e) => handleRightClick(e, file.id)}
              >
                <div className="mb-2">
                  {file.type === "folder" ? (
                    <FilledFolder className="w-12 h-12" color="text-blue-500" />
                  ) : (
                    <FilledFile
                      className="w-12 h-12"
                      color="text-neutral-500"
                    />
                  )}
                </div>
                <span className="text-sm text-neutral-900 dark:text-neutral-100 text-center truncate w-full">
                  {file.name}
                </span>
                {file.type === "file" && (
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
            onConfirm={
              createDialog.type === "file"
                ? handleCreateFile
                : handleCreateFolder
            }
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
                  selectedFiles.includes(file.id) &&
                    "bg-neutral-200 dark:bg-neutral-800"
                )}
                onClick={(e) => handleFileClick(file.id, e)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                onContextMenu={(e) => handleRightClick(e, file.id)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    {file.type === "folder" ? (
                      <FilledFolder className="w-4 h-4" color="text-blue-500" />
                    ) : (
                      <FilledFile
                        className="w-4 h-4"
                        color="text-neutral-500"
                      />
                    )}
                    <span className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {file.type === "file" ? formatFileSize(file.size) : "—"}
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
          onConfirm={
            createDialog.type === "file" ? handleCreateFile : handleCreateFolder
          }
          type={createDialog.type}
        />
      )}
    </div>
  );
};

export default FileExplorer;
