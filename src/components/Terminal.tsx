import { useAtom } from "jotai";
import { X, Minus } from "lucide-react";
import {
  terminalOpenAtom,
  currentPathAtom,
  // themeAtom
} from "@/store/atoms";

const Terminal = () => {
  const [isOpen, setIsOpen] = useAtom(terminalOpenAtom);
  const [currentPath] = useAtom(currentPathAtom);
  // const [theme] = useAtom(themeAtom);

  if (!isOpen) return null;

  const handleClose = () => setIsOpen(false);
  const handleMinimize = () => setIsOpen(false); // Changed: minimize now closes the terminal completely

  return (
    <div className="h-full bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Terminal
          </span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded">
            {currentPath}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleMinimize}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Minimize Terminal"
          >
            <Minus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Close Terminal"
          >
            <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-6 overflow-y-auto font-mono text-sm bg-white dark:bg-black"></div>

      {/* Terminal Footer */}
      <div className="px-6 py-3 bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center justify-between">
          <span>Ready for XTerm.js integration</span>
          <span>
            Press{" "}
            <kbd className="bg-neutral-200 dark:bg-neutral-800 px-1 rounded">
              Ctrl+Shift+`
            </kbd>{" "}
            to toggle
          </span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
