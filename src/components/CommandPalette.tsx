import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import {
  Search,
  Command,
  Plus,
  Folder,
  File,
  Settings,
  Cloud,
  Eye,
  EyeOff,
  Terminal,
} from "lucide-react";
import {
  commandPaletteOpenAtom,
  currentPathAtom,
  showHiddenFilesAtom,
  terminalOpenAtom,
} from "@/store/atoms";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
}

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useAtom(commandPaletteOpenAtom);
  const [, setCurrentPath] = useAtom(currentPathAtom);
  const [showHiddenFiles, setShowHiddenFiles] = useAtom(showHiddenFilesAtom);
  const [terminalOpen, setTerminalOpen] = useAtom(terminalOpenAtom);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commandListRef = useRef<HTMLDivElement>(null);

  // Dynamically generate navigation paths based on the user's home directory
  const homeBase = useAtom(currentPathAtom)[0].split("/").slice(0, 3).join("/"); // e.g. /home/unnikrishnan

  const commands: Command[] = [
    {
      id: "toggle-terminal",
      title: terminalOpen ? "Close Terminal" : "Open Terminal",
      description: terminalOpen
        ? "Hide the terminal panel"
        : "Show the terminal panel",
      icon: Terminal,
      action: () => setTerminalOpen(!terminalOpen),
      group: "View",
    },
    {
      id: "toggle-hidden-files",
      title: showHiddenFiles ? "Hide Hidden Files" : "Show Hidden Files",
      description: showHiddenFiles
        ? "Hide files and folders that start with a dot"
        : "Show files and folders that start with a dot",
      icon: showHiddenFiles ? EyeOff : Eye,
      action: () => setShowHiddenFiles(!showHiddenFiles),
      group: "View",
    },
    {
      id: "new-file",
      title: "New File",
      description: "Create a new file in current directory",
      icon: File,
      action: () => console.log("Creating new file"),
      group: "File Operations",
    },
    {
      id: "new-folder",
      title: "New Folder",
      description: "Create a new folder in current directory",
      icon: Folder,
      action: () => console.log("Creating new folder"),
      group: "File Operations",
    },
    {
      id: "go-home",
      title: "Go to Home",
      description: "Navigate to home directory",
      icon: Folder,
      action: () => setCurrentPath(homeBase),
      group: "Navigation",
    },
    {
      id: "go-desktop",
      title: "Go to Desktop",
      description: "Navigate to desktop directory",
      icon: Folder,
      action: () => setCurrentPath(`${homeBase}/Desktop`),
      group: "Navigation",
    },
    {
      id: "go-documents",
      title: "Go to Documents",
      description: "Navigate to documents directory",
      icon: Folder,
      action: () => setCurrentPath(`${homeBase}/Documents`),
      group: "Navigation",
    },
    {
      id: "settings",
      title: "Open Settings",
      description: "Open application settings",
      icon: Settings,
      action: () => setCurrentPath("/settings"),
      group: "Application",
    },
    {
      id: "connect-cloud",
      title: "Connect Cloud Storage",
      description: "Connect a new cloud storage provider",
      icon: Cloud,
      action: () => console.log("Opening cloud connection"),
      group: "Cloud",
    },
  ];

  const filteredCommands = commands.filter(
    (command) =>
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.description.toLowerCase().includes(query.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.group]) {
      acc[command.group] = [];
    }
    acc[command.group].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  const allFilteredCommands = Object.values(groupedCommands).flat();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, [setIsOpen]);

  const scrollSelectedIntoView = useCallback(() => {
    if (commandListRef.current) {
      const selectedElement = commandListRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    scrollSelectedIntoView();
  }, [selectedIndex, scrollSelectedIntoView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < allFilteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : allFilteredCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (allFilteredCommands[selectedIndex]) {
            allFilteredCommands[selectedIndex].action();
            handleClose();
          }
          break;
        case "Escape":
          handleClose();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, allFilteredCommands, setIsOpen, handleClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl mx-4 bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-4 h-4 text-neutral-400 mr-3" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-neutral-900 dark:text-neutral-100 text-sm placeholder-neutral-400"
            autoFocus
          />
          <div className="flex items-center space-x-2 text-xs text-neutral-400">
            <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded text-xs font-mono">
              Esc
            </kbd>
          </div>
        </div>

        {/* Commands List */}
        <div
          ref={commandListRef}
          className="max-h-72 overflow-y-auto scroll-smooth"
        >
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              <Command className="w-6 h-6 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-sm">No commands found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-1">
              {Object.entries(groupedCommands).map(([group, commands]) => (
                <div key={group} className="mb-1 last:mb-0">
                  <div className="px-4 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800">
                    {group}
                  </div>
                  {commands.map((command) => {
                    const globalIndex = allFilteredCommands.indexOf(command);
                    return (
                      <button
                        key={command.id}
                        data-index={globalIndex}
                        onClick={() => {
                          command.action();
                          handleClose();
                        }}
                        className={cn(
                          "w-full flex items-center px-4 py-2.5 text-left transition-colors",
                          globalIndex === selectedIndex
                            ? "bg-neutral-100 dark:bg-neutral-800 border-r-2 border-neutral-500"
                            : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        )}
                      >
                        <command.icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {command.title}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {command.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
          <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs font-mono">
                ↑↓
              </kbd>
              <span>navigate</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs font-mono">
                ↵
              </kbd>
              <span>select</span>
            </div>
          </div>
          <button className="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
            <Plus className="w-3 h-3" />
            <span>Create Custom Command</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
