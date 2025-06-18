export interface TerminalAPI {
  create: () => Promise<string>;
  destroy: () => Promise<string>;
  sendInput: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  onOutput: (callback: (data: string) => void) => void;
  offOutput: (callback: (data: string) => void) => void;
}

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  modified: Date;
  path: string;
  icon?: string;
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
  file?: FileItem;
  folder?: FileItem;
}

export interface PathExistsResult {
  exists: boolean;
}

export interface ElectronAPI {
  listDirectory: (
    dirPath: string
  ) => Promise<{ success: boolean; files?: FileItem[]; error?: string }>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getHomeDir: () => Promise<string>;
  openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;

  // File operations
  createFile: (
    filePath: string,
    content?: string
  ) => Promise<FileOperationResult>;
  createFolder: (folderPath: string) => Promise<FileOperationResult>;
  deleteFile: (filePath: string) => Promise<FileOperationResult>;
  renameFile: (
    oldPath: string,
    newPath: string
  ) => Promise<FileOperationResult>;
  checkPathExists: (filePath: string) => Promise<PathExistsResult>;

  terminal: TerminalAPI;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
