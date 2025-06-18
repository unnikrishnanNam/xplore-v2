import React, { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import {
  FilePlus,
  FolderPlus,
  Settings,
  File,
  FileText,
  Edit3,
} from "lucide-react";
import {
  filesAtom,
  selectedFilesAtom,
  currentPathAtom,
  fileViewModeAtom,
  fileSortModeAtom,
  fileSortOrderAtom,
  showHiddenFilesAtom,
  commandPaletteOpenAtom,
  createFileDialogAtom,
  renameDialogAtom,
} from "@/store/atoms";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import Toolbar from "./Toolbar";
import { FilledFile, FilledFolder } from "./Icons";
import MultiStepDialog from "./MultiStepDialog";
import type { FileItem } from "@/store/atoms";

const FileExplorer = () => {
  const [files, setFiles] = useAtom(filesAtom);
  const [selectedFiles, setSelectedFiles] = useAtom(selectedFilesAtom);
  const [currentPath, setCurrentPath] = useAtom(currentPathAtom);
  const [viewMode] = useAtom(fileViewModeAtom);
  const [sortMode] = useAtom(fileSortModeAtom);
  const [sortOrder] = useAtom(fileSortOrderAtom);
  const [showHiddenFiles] = useAtom(showHiddenFilesAtom);
  const [, setCommandPaletteOpen] = useAtom(commandPaletteOpenAtom);
  const [createDialog, setCreateDialog] = useAtom(createFileDialogAtom);
  const [renameDialog, setRenameDialog] = useAtom(renameDialogAtom);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    fileId?: string;
  } | null>(null);
  const [clipboard, setClipboard] = useState<{
    items: FileItem[];
    operation: "copy" | "cut";
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
  const handleCreateFile = async (values: Record<string, string>) => {
    const name = values.filename;
    const extension = values.extension;
    const fullName = extension ? `${name}.${extension}` : name;
    const filePath = `${currentPath}/${fullName}`;

    try {
      if (window.electronAPI?.createFile) {
        const result = await window.electronAPI.createFile(filePath, "");

        if (result.success && result.file) {
          // Add the new file to the state
          setFiles((prev) => [...prev, result.file!]);

          // Show success notification
          toast.success("File created successfully", {
            description: `Created ${result.file.name}`,
          });

          // Refresh the directory to ensure consistency
          refreshDirectory();
        } else {
          console.error("Failed to create file:", result.error);
          toast.error("Failed to create file", {
            description: result.error || "Unknown error occurred",
          });
        }
      } else {
        // Fallback to mock behavior for development
        const newFile = {
          id: Date.now().toString(),
          name: fullName,
          type: "file" as const,
          size: 0,
          modified: new Date(),
          path: filePath,
        };
        setFiles((prev) => [...prev, newFile]);
      }
    } catch (error) {
      console.error("Error creating file:", error);
      toast.error("Error creating file", {
        description: String(error),
      });
    }

    // Close command palette if it was open
    setCommandPaletteOpen(false);
  };

  const handleCreateFolder = async (values: Record<string, string>) => {
    const name = values.foldername;
    const folderPath = `${currentPath}/${name}`;

    try {
      if (window.electronAPI?.createFolder) {
        const result = await window.electronAPI.createFolder(folderPath);

        if (result.success && result.folder) {
          // Add the new folder to the state
          setFiles((prev) => [...prev, result.folder!]);

          // Show success notification
          toast.success("Folder created successfully", {
            description: `Created ${result.folder.name}`,
          });

          // Refresh the directory to ensure consistency
          refreshDirectory();
        } else {
          console.error("Failed to create folder:", result.error);
          toast.error("Failed to create folder", {
            description: result.error || "Unknown error occurred",
          });
        }
      } else {
        // Fallback to mock behavior for development
        const newFolder = {
          id: Date.now().toString(),
          name,
          type: "folder" as const,
          modified: new Date(),
          path: folderPath,
        };
        setFiles((prev) => [...prev, newFolder]);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Error creating folder", {
        description: String(error),
      });
    }

    // Close command palette if it was open
    setCommandPaletteOpen(false);
  };

  // Function to refresh directory contents
  const refreshDirectory = async () => {
    if (window.electronAPI?.listDirectory) {
      try {
        const result = await window.electronAPI.listDirectory(currentPath);
        if (result.success && result.files) {
          setFiles(result.files);
        }
      } catch (error) {
        console.error("Error refreshing directory:", error);
      }
    }
  };

  // Action handlers for context menu operations
  const handleDelete = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    if (window.electronAPI?.deleteFile) {
      try {
        const result = await window.electronAPI.deleteFile(file.path);

        if (result.success) {
          // Remove the file from state
          setFiles((prev) => prev.filter((f) => f.id !== fileId));
          setSelectedFiles((prev) => prev.filter((id) => id !== fileId));

          toast.success(
            `${
              file.type === "folder" ? "Folder" : "File"
            } deleted successfully`,
            {
              description: `Deleted ${file.name}`,
            }
          );

          // Refresh directory
          refreshDirectory();
        } else {
          toast.error(
            `Failed to delete ${file.type === "folder" ? "folder" : "file"}`,
            {
              description: result.error || "Unknown error occurred",
            }
          );
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        toast.error(
          `Error deleting ${file.type === "folder" ? "folder" : "file"}`,
          {
            description: String(error),
          }
        );
      }
    } else {
      // Fallback for development
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
      toast.success(`${file.type === "folder" ? "Folder" : "File"} deleted`, {
        description: `Deleted ${file.name}`,
      });
    }
    closeContextMenu();
  };

  const handleRenameClick = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (file) {
      setRenameDialog({
        open: true,
        fileId,
        currentName: file.name,
        fileType: file.type,
      });
    }
    closeContextMenu();
  };

  const handleRenameConfirm = async (values: Record<string, string>) => {
    if (!renameDialog) return;

    const newName = values.newname;
    const file = files.find((f) => f.id === renameDialog.fileId);
    if (!file) return;

    const newPath = `${currentPath}/${newName}`;

    if (window.electronAPI?.renameFile) {
      try {
        const result = await window.electronAPI.renameFile(file.path, newPath);

        if (result.success && result.file) {
          // Update the file in state
          setFiles((prev) =>
            prev.map((f) => (f.id === renameDialog.fileId ? result.file! : f))
          );

          toast.success(
            `${
              file.type === "folder" ? "Folder" : "File"
            } renamed successfully`,
            {
              description: `Renamed to ${newName}`,
            }
          );

          // Refresh directory
          refreshDirectory();
        } else {
          toast.error(
            `Failed to rename ${file.type === "folder" ? "folder" : "file"}`,
            {
              description: result.error || "Unknown error occurred",
            }
          );
        }
      } catch (error) {
        console.error("Error renaming file:", error);
        toast.error(
          `Error renaming ${file.type === "folder" ? "folder" : "file"}`,
          {
            description: String(error),
          }
        );
      }
    } else {
      // Fallback for development
      setFiles((prev) =>
        prev.map((f) =>
          f.id === renameDialog.fileId
            ? { ...f, name: newName, path: newPath }
            : f
        )
      );
      toast.success(`${file.type === "folder" ? "Folder" : "File"} renamed`, {
        description: `Renamed to ${newName}`,
      });
    }

    setRenameDialog(null);
  };

  const handleCopy = (fileIds: string[]) => {
    const filesToCopy = files.filter((f) => fileIds.includes(f.id));
    setClipboard({ items: filesToCopy, operation: "copy" });
    toast.success(
      `Copied ${filesToCopy.length} item${filesToCopy.length > 1 ? "s" : ""}`,
      {
        description: filesToCopy.map((f) => f.name).join(", "),
      }
    );
    closeContextMenu();
  };

  const handleCut = (fileIds: string[]) => {
    const filesToCut = files.filter((f) => fileIds.includes(f.id));
    setClipboard({ items: filesToCut, operation: "cut" });
    toast.success(
      `Cut ${filesToCut.length} item${filesToCut.length > 1 ? "s" : ""}`,
      {
        description: filesToCut.map((f) => f.name).join(", "),
      }
    );
    closeContextMenu();
  };

  const handlePaste = async () => {
    if (!clipboard || clipboard.items.length === 0) {
      toast.error("Nothing to paste");
      return;
    }

    try {
      for (const item of clipboard.items) {
        const newPath = `${currentPath}/${item.name}`;

        if (clipboard.operation === "copy") {
          // For copy operation, we'd need to implement file copying in the backend
          // For now, show a message that copy is not yet implemented
          toast.error("Copy operation not yet implemented", {
            description: "This feature will be available in a future update",
          });
        } else if (clipboard.operation === "cut") {
          // For cut operation, we can use rename/move
          if (window.electronAPI?.renameFile) {
            const result = await window.electronAPI.renameFile(
              item.path,
              newPath
            );

            if (result.success && result.file) {
              // Update file list
              setFiles((prev) =>
                prev.map((f) => (f.id === item.id ? result.file! : f))
              );

              toast.success(`Moved ${item.name}`, {
                description: `Moved to ${currentPath}`,
              });
            } else {
              toast.error(`Failed to move ${item.name}`, {
                description: result.error || "Unknown error occurred",
              });
            }
          }
        }
      }

      // Clear clipboard after paste
      if (clipboard.operation === "cut") {
        setClipboard(null);
      }

      // Refresh directory
      refreshDirectory();
    } catch (error) {
      console.error("Error pasting files:", error);
      toast.error("Error pasting files", {
        description: String(error),
      });
    }

    closeContextMenu();
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
              <button
                className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                onClick={() => handleCopy([contextMenu.fileId!])}
              >
                Copy
              </button>
              <button
                className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                onClick={() => handleCut([contextMenu.fileId!])}
              >
                Cut
              </button>
              <button
                className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                onClick={() => handleRenameClick(contextMenu.fileId!)}
              >
                Rename
              </button>
              <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-2 my-1" />
              <button
                className="w-full group flex items-center text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                onClick={() => handleDelete(contextMenu.fileId!)}
              >
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
              <button
                className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePaste}
                disabled={!clipboard || clipboard.items.length === 0}
              >
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
          <MultiStepDialog
            open={createDialog.open}
            onOpenChange={(open) => setCreateDialog(open ? createDialog : null)}
            title={`Create ${
              createDialog.type === "file" ? "New File" : "New Folder"
            }`}
            steps={
              createDialog.type === "file"
                ? [
                    {
                      id: "filename",
                      title: "File Name",
                      description: "Enter the name for your new file",
                      placeholder: "Enter file name (without extension)...",
                      value: "",
                      required: true,
                      icon: File,
                      validation: (value, values) => {
                        if (!value.trim()) return "File name is required";
                        if (value.includes("/") || value.includes("\\")) {
                          return "File name cannot contain slashes";
                        }
                        if (value.length > 255) {
                          return "File name is too long";
                        }
                        // Check for existing files
                        const extension = values?.extension;
                        const fullName = extension
                          ? `${value}.${extension}`
                          : value;
                        const exists = sortedFiles.some(
                          (file) => file.name === fullName
                        );
                        if (exists) {
                          return "A file with this name already exists";
                        }
                        return null;
                      },
                    },
                    {
                      id: "extension",
                      title: "File Extension",
                      description: "Enter the file extension (optional)",
                      placeholder: "Enter extension (e.g., txt, js, py)...",
                      value: "",
                      icon: FileText,
                      validation: (value, values) => {
                        if (value && value.includes(".")) {
                          return "Extension should not include the dot";
                        }
                        if (value && value.length > 10) {
                          return "Extension is too long";
                        }
                        // Check for existing files with the full name
                        const filename = values?.filename;
                        if (filename && value) {
                          const fullName = `${filename}.${value}`;
                          const exists = sortedFiles.some(
                            (file) => file.name === fullName
                          );
                          if (exists) {
                            return "A file with this name already exists";
                          }
                        }
                        return null;
                      },
                    },
                  ]
                : [
                    {
                      id: "foldername",
                      title: "Folder Name",
                      description: "Enter the name for your new folder",
                      placeholder: "Enter folder name...",
                      value: "",
                      required: true,
                      icon: FolderPlus,
                      validation: (value) => {
                        if (!value.trim()) return "Folder name is required";
                        if (value.includes("/") || value.includes("\\")) {
                          return "Folder name cannot contain slashes";
                        }
                        if (value.length > 255) {
                          return "Folder name is too long";
                        }
                        // Check for existing folders using in-memory file list
                        // (Real-time file system checking will happen on creation)
                        const exists = sortedFiles.some(
                          (file) =>
                            file.name === value && file.type === "folder"
                        );
                        if (exists) {
                          return "A folder with this name already exists";
                        }
                        return null;
                      },
                    },
                  ]
            }
            onComplete={
              createDialog.type === "file"
                ? handleCreateFile
                : handleCreateFolder
            }
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
        <MultiStepDialog
          open={createDialog.open}
          onOpenChange={(open) => setCreateDialog(open ? createDialog : null)}
          title={`Create ${
            createDialog.type === "file" ? "New File" : "New Folder"
          }`}
          steps={
            createDialog.type === "file"
              ? [
                  {
                    id: "filename",
                    title: "File Name",
                    description: "Enter the name for your new file",
                    placeholder: "Enter file name (without extension)...",
                    value: "",
                    required: true,
                    icon: File,
                    validation: (value, values) => {
                      if (!value.trim()) return "File name is required";
                      if (value.includes("/") || value.includes("\\")) {
                        return "File name cannot contain slashes";
                      }
                      if (value.length > 255) {
                        return "File name is too long";
                      }
                      // Check for existing files using in-memory file list
                      // (Real-time file system checking will happen on creation)
                      const extension = values?.extension;
                      const fullName = extension
                        ? `${value}.${extension}`
                        : value;
                      const exists = sortedFiles.some(
                        (file) => file.name === fullName
                      );
                      if (exists) {
                        return "A file with this name already exists";
                      }
                      return null;
                    },
                  },
                  {
                    id: "extension",
                    title: "File Extension",
                    description: "Enter the file extension (optional)",
                    placeholder: "Enter extension (e.g., txt, js, py)...",
                    value: "",
                    icon: FileText,
                    validation: (value, values) => {
                      if (value && value.includes(".")) {
                        return "Extension should not include the dot";
                      }
                      if (value && value.length > 10) {
                        return "Extension is too long";
                      }
                      // Check for existing files with the full name using in-memory file list
                      // (Real-time file system checking will happen on creation)
                      const filename = values?.filename;
                      if (filename && value) {
                        const fullName = `${filename}.${value}`;
                        const exists = sortedFiles.some(
                          (file) => file.name === fullName
                        );
                        if (exists) {
                          return "A file with this name already exists";
                        }
                      }
                      return null;
                    },
                  },
                ]
              : [
                  {
                    id: "foldername",
                    title: "Folder Name",
                    description: "Enter the name for your new folder",
                    placeholder: "Enter folder name...",
                    value: "",
                    required: true,
                    icon: FolderPlus,
                    validation: (value) => {
                      if (!value.trim()) return "Folder name is required";
                      if (value.includes("/") || value.includes("\\")) {
                        return "Folder name cannot contain slashes";
                      }
                      if (value.length > 255) {
                        return "Folder name is too long";
                      }
                      // Check for existing folders
                      const exists = sortedFiles.some(
                        (file) => file.name === value && file.type === "folder"
                      );
                      if (exists) {
                        return "A folder with this name already exists";
                      }
                      return null;
                    },
                  },
                ]
          }
          onComplete={
            createDialog.type === "file" ? handleCreateFile : handleCreateFolder
          }
        />
      )}

      {/* Rename Dialog */}
      {renameDialog && (
        <MultiStepDialog
          open={renameDialog.open}
          onOpenChange={(open) => setRenameDialog(open ? renameDialog : null)}
          title={`Rename ${
            renameDialog.fileType === "folder" ? "Folder" : "File"
          }`}
          steps={[
            {
              id: "newname",
              title: "New Name",
              description: `Enter a new name for this ${renameDialog.fileType}`,
              placeholder: `Enter new ${renameDialog.fileType} name...`,
              value: renameDialog.currentName,
              required: true,
              icon: Edit3,
              validation: (value) => {
                if (!value.trim())
                  return `${
                    renameDialog.fileType === "folder" ? "Folder" : "File"
                  } name is required`;
                if (value.includes("/") || value.includes("\\")) {
                  return `${
                    renameDialog.fileType === "folder" ? "Folder" : "File"
                  } name cannot contain slashes`;
                }
                if (value.length > 255) {
                  return `${
                    renameDialog.fileType === "folder" ? "Folder" : "File"
                  } name is too long`;
                }
                // Check for existing files/folders with the same name (excluding current item)
                const exists = sortedFiles.some(
                  (file) =>
                    file.name === value &&
                    file.id !== renameDialog.fileId &&
                    file.type === renameDialog.fileType
                );
                if (exists) {
                  return `A ${renameDialog.fileType} with this name already exists`;
                }
                return null;
              },
            },
          ]}
          onComplete={handleRenameConfirm}
        />
      )}
    </div>
  );
};

export default FileExplorer;
