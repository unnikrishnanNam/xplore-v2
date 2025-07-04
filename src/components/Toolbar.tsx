import React, { useRef, useEffect } from "react";
import { useAtom } from "jotai";
import {
  Home,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  Terminal,
  Command,
  MoreVertical,
  List,
  Grid2X2,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  sidebarCollapsedAtom,
  currentPathAtom,
  terminalOpenAtom,
  commandPaletteOpenAtom,
  fileViewModeAtom,
  fileSortModeAtom,
  fileSortOrderAtom,
  showHiddenFilesAtom,
} from "@/store/atoms";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const Toolbar = () => {
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const [currentPath, setCurrentPath] = useAtom(currentPathAtom);
  const [terminalOpen, setTerminalOpen] = useAtom(terminalOpenAtom);
  const [commandPaletteOpen, setCommandPaletteOpen] = useAtom(
    commandPaletteOpenAtom
  );
  const [viewMode, setViewMode] = useAtom(fileViewModeAtom);
  const [sortMode, setSortMode] = useAtom(fileSortModeAtom);
  const [sortOrder, setSortOrder] = useAtom(fileSortOrderAtom);
  const [showHiddenFiles, setShowHiddenFiles] = useAtom(showHiddenFilesAtom);

  const breadcrumbRef = useRef<HTMLDivElement>(null);

  const getBreadcrumbItems = () => {
    const parts = currentPath.split("/").filter(Boolean);
    return [
      { name: "Home", path: "/home" },
      ...parts.slice(1).map((part, index) => ({
        name: part,
        path: "/" + parts.slice(0, index + 2).join("/"),
      })),
    ];
  };

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleTerminal = () => setTerminalOpen(!terminalOpen);
  const toggleCommandPalette = () => setCommandPaletteOpen(!commandPaletteOpen);
  const toggleViewMode = () =>
    setViewMode(viewMode === "list" ? "grid" : "list");
  const toggleSortOrder = () =>
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");

  useEffect(() => {
    // Scroll to the last breadcrumb item whenever the path changes
    if (breadcrumbRef.current) {
      breadcrumbRef.current.scrollLeft = breadcrumbRef.current.scrollWidth;
    }
  }, [currentPath]);

  return (
    <div className="bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left side: Sidebar toggle + Breadcrumb */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="flex-shrink-0 p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            )}
          </button>

          {/* Breadcrumb wrapper with fade effect */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-0 top-0 bottom-0 z-10 w-8 pointer-events-none bg-gradient-to-r from-neutral-100 dark:from-neutral-950 to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 z-10 w-8 pointer-events-none bg-gradient-to-l from-neutral-100 dark:from-neutral-950 to-transparent" />

            <nav
              ref={breadcrumbRef}
              className="flex items-center space-x-1 text-sm overflow-x-auto max-w-full no-scrollbar px-8"
              style={{
                scrollBehavior: "smooth",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <div className="flex-shrink-0">
                <Home className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              </div>
              {getBreadcrumbItems().map((item, index) => (
                <React.Fragment key={item.path}>
                  <ChevronRight className="flex-shrink-0 w-3 h-3 text-neutral-400" />
                  <button
                    className={cn(
                      "flex-shrink-0 text-xs transition-colors hover:text-neutral-900 dark:hover:text-neutral-100 whitespace-nowrap px-0.5",
                      index === getBreadcrumbItems().length - 1
                        ? "text-neutral-900 dark:text-neutral-100 font-medium"
                        : "text-neutral-600 dark:text-neutral-300"
                    )}
                    onClick={() => setCurrentPath(item.path)}
                    disabled={index === getBreadcrumbItems().length - 1}
                  >
                    {item.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>

        {/* Center: View and Sort controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleViewMode}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            )}
            title={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
          >
            {viewMode === "list" ? (
              <Grid2X2 className="w-4 h-4" />
            ) : (
              <List className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setShowHiddenFiles(!showHiddenFiles)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showHiddenFiles
                ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                : "hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            )}
            title={`${showHiddenFiles ? "Hide" : "Show"} hidden files`}
          >
            {showHiddenFiles ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 dark:text-neutral-400"
                title="Sort options"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-2">
              <div className="space-y-1">
                <Button
                  variant={sortMode === "name" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sm h-8",
                    sortMode === "name"
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                  )}
                  onClick={() => setSortMode("name")}
                >
                  Sort by Name
                </Button>
                <Button
                  variant={sortMode === "size" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sm h-8",
                    sortMode === "size"
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                  )}
                  onClick={() => setSortMode("size")}
                >
                  Sort by Size
                </Button>
                <Button
                  variant={sortMode === "modified" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sm h-8",
                    sortMode === "modified"
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                  )}
                  onClick={() => setSortMode("modified")}
                >
                  Sort by Modified
                </Button>
                <hr className="border-t border-neutral-200 dark:border-neutral-800" />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm h-8 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                  onClick={toggleSortOrder}
                >
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleTerminal}
            className={cn(
              "p-2 rounded-lg transition-colors",
              terminalOpen
                ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                : "hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            )}
            title="Toggle Terminal"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <button
            onClick={toggleCommandPalette}
            className={cn(
              "p-2 rounded-lg transition-colors",
              commandPaletteOpen
                ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                : "hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            )}
            title="Toggle Command Palette"
          >
            <Command className="w-4 h-4" />
          </button>

          <button className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
