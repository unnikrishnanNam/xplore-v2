import { atom } from "jotai";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  modified: Date;
  path: string;
  icon?: string;
}

export interface CloudProvider {
  id: string;
  name: string;
  type: "google-drive" | "onedrive" | "dropbox" | "vm-service";
  connected: boolean;
}

// Theme atoms
export const themeAtom = atom<"light" | "dark">(
  typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);

// UI state atoms
export const sidebarCollapsedAtom = atom(false);
export const terminalOpenAtom = atom(true); // Default to open
export const terminalMinimizedAtom = atom(false);
export const commandPaletteOpenAtom = atom(false);
export const showHiddenFilesAtom = atom(false);
export const createFileDialogAtom = atom<{
  open: boolean;
  type: "file" | "folder";
} | null>(null);
export const renameDialogAtom = atom<{
  open: boolean;
  fileId: string;
  currentName: string;
  fileType: "file" | "folder";
} | null>(null);
export const demoModeAtom = atom(false);

// File system atoms
// Synchronous fallback for initial render
const initialHome = "/home";

export const currentPathAtom = atom(initialHome);
export const selectedFilesAtom = atom<string[]>([]);
export const pinnedFoldersAtom = atom([
  `${initialHome}/Projects`,
  `${initialHome}/Documents/Important`,
]);

export const filesAtom = atom<FileItem[]>([
  {
    id: "1",
    name: "package.json",
    type: "file",
    size: 1024,
    modified: new Date(),
    path: `${initialHome}/package.json`,
  },
  {
    id: "2",
    name: "src",
    type: "folder",
    modified: new Date(),
    path: `${initialHome}/src`,
  },
  {
    id: "3",
    name: "README.md",
    type: "file",
    size: 2048,
    modified: new Date(),
    path: `${initialHome}/README.md`,
  },
  {
    id: "4",
    name: "components",
    type: "folder",
    modified: new Date(),
    path: `${initialHome}/components`,
  },
  {
    id: "5",
    name: "index.ts",
    type: "file",
    size: 512,
    modified: new Date(),
    path: `${initialHome}/index.ts`,
  },
]);

export const updateHomeAtoms = atom(null, async (_get, set) => {
  if (
    typeof window !== "undefined" &&
    window.electronAPI &&
    window.electronAPI.getHomeDir
  ) {
    const home = await window.electronAPI.getHomeDir();
    set(currentPathAtom, home);
    set(pinnedFoldersAtom, [`${home}/Projects`, `${home}/Documents/Important`]);
    set(filesAtom, [
      {
        id: "1",
        name: "package.json",
        type: "file",
        size: 1024,
        modified: new Date(),
        path: `${home}/package.json`,
      },
      {
        id: "2",
        name: "src",
        type: "folder",
        modified: new Date(),
        path: `${home}/src`,
      },
      {
        id: "3",
        name: "README.md",
        type: "file",
        size: 2048,
        modified: new Date(),
        path: `${home}/README.md`,
      },
      {
        id: "4",
        name: "components",
        type: "folder",
        modified: new Date(),
        path: `${home}/components`,
      },
      {
        id: "5",
        name: "index.ts",
        type: "file",
        size: 512,
        modified: new Date(),
        path: `${home}/index.ts`,
      },
    ]);
  }
});

// Cloud providers atom
export const cloudProvidersAtom = atom<CloudProvider[]>([
  // { id: "1", name: "Google Drive", type: "google-drive", connected: false },
  // { id: "2", name: "OneDrive", type: "onedrive", connected: false },
  // { id: "3", name: "Dropbox", type: "dropbox", connected: false },
  { id: "4", name: "VM Service", type: "vm-service", connected: false },
]);

// File view and sorting atoms
export const fileViewModeAtom = atom<"list" | "grid">("list");
export const fileSortModeAtom = atom<"name" | "size" | "modified">("name");
export const fileSortOrderAtom = atom<"asc" | "desc">("asc");
