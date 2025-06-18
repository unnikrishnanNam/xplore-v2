import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { X, Minus } from "lucide-react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { terminalOpenAtom, currentPathAtom, themeAtom } from "@/store/atoms";

const Terminal = () => {
  const [isOpen, setIsOpen] = useAtom(terminalOpenAtom);
  const [currentPath] = useAtom(currentPathAtom);
  const [theme] = useAtom(themeAtom);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleClose = () => {
    // Destroy terminal process and cleanup
    if (xtermRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const electronAPI = window.electronAPI as any;
      if (electronAPI?.terminal?.destroy) {
        electronAPI.terminal.destroy();
      }
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    setIsOpen(false);
    setIsInitialized(false);
  };

  const handleMinimize = () => setIsOpen(false);

  // Initialize terminal when component mounts or when opened
  useEffect(() => {
    if (!isOpen || !terminalRef.current || isInitialized) return;

    const initTerminal = async () => {
      try {
        // Create xterm instance with theme-aware colors
        const term = new XTerm({
          fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
          fontSize: 14,
          lineHeight: 1.2,
          theme:
            theme === "dark"
              ? {
                  background: "#000000",
                  foreground: "#ffffff",
                  cursor: "#ffffff",
                  black: "#000000",
                  red: "#ff5555",
                  green: "#50fa7b",
                  yellow: "#f1fa8c",
                  blue: "#bd93f9",
                  magenta: "#ff79c6",
                  cyan: "#8be9fd",
                  white: "#bfbfbf",
                  brightBlack: "#4d4d4d",
                  brightRed: "#ff6e67",
                  brightGreen: "#5af78e",
                  brightYellow: "#f4f99d",
                  brightBlue: "#caa9fa",
                  brightMagenta: "#ff92d0",
                  brightCyan: "#9aedfe",
                  brightWhite: "#e6e6e6",
                }
              : {
                  background: "#ffffff",
                  foreground: "#000000",
                  cursor: "#000000",
                  black: "#000000",
                  red: "#cd3131",
                  green: "#00bc00",
                  yellow: "#949800",
                  blue: "#0451a5",
                  magenta: "#bc05bc",
                  cyan: "#0598bc",
                  white: "#555555",
                  brightBlack: "#686868",
                  brightRed: "#cd3131",
                  brightGreen: "#00bc00",
                  brightYellow: "#949800",
                  brightBlue: "#0451a5",
                  brightMagenta: "#bc05bc",
                  brightCyan: "#0598bc",
                  brightWhite: "#a5a5a5",
                },
          cursorBlink: true,
          allowTransparency: false,
          scrollback: 1000,
          // Enable auto-scroll to bottom
          scrollOnUserInput: true,
          convertEol: true,
        });

        // Create and attach addons
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);

        fitAddonRef.current = fitAddon;
        xtermRef.current = term;

        // Open terminal in DOM
        if (terminalRef.current) {
          term.open(terminalRef.current);
        }

        // Fit terminal to container after a short delay to ensure DOM is ready
        setTimeout(() => {
          fitAddon.fit();
        }, 50);

        // Create PTY process
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const electronAPI = window.electronAPI as any;
        if (electronAPI?.terminal) {
          await electronAPI.terminal.create();

          // Listen for PTY output with auto-scroll
          electronAPI.terminal.onOutput((data: string) => {
            term.write(data);
            // Force scroll to bottom after writing data
            setTimeout(() => {
              term.scrollToBottom();
            }, 0);
          });

          // Send input to PTY
          term.onData((data) => {
            electronAPI.terminal?.sendInput(data);
          });

          // Resize PTY on terminal resize
          term.onResize(({ cols, rows }) => {
            electronAPI.terminal?.resize(cols, rows);
          });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize terminal:", error);
      }
    };

    initTerminal();
  }, [isOpen, theme, isInitialized]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (xtermRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const electronAPI = window.electronAPI as any;
        if (electronAPI?.terminal?.destroy) {
          electronAPI.terminal.destroy();
        }
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (xtermRef.current && isInitialized) {
      const term = xtermRef.current;
      const newTheme =
        theme === "dark"
          ? {
              background: "#000000",
              foreground: "#ffffff",
              cursor: "#ffffff",
              black: "#000000",
              red: "#ff5555",
              green: "#50fa7b",
              yellow: "#f1fa8c",
              blue: "#bd93f9",
              magenta: "#ff79c6",
              cyan: "#8be9fd",
              white: "#bfbfbf",
              brightBlack: "#4d4d4d",
              brightRed: "#ff6e67",
              brightGreen: "#5af78e",
              brightYellow: "#f4f99d",
              brightBlue: "#caa9fa",
              brightMagenta: "#ff92d0",
              brightCyan: "#9aedfe",
              brightWhite: "#e6e6e6",
            }
          : {
              background: "#ffffff",
              foreground: "#000000",
              cursor: "#000000",
              black: "#000000",
              red: "#cd3131",
              green: "#00bc00",
              yellow: "#949800",
              blue: "#0451a5",
              magenta: "#bc05bc",
              cyan: "#0598bc",
              white: "#555555",
              brightBlack: "#686868",
              brightRed: "#cd3131",
              brightGreen: "#00bc00",
              brightYellow: "#949800",
              brightBlue: "#0451a5",
              brightMagenta: "#bc05bc",
              brightCyan: "#0598bc",
              brightWhite: "#a5a5a5",
            };

      term.options.theme = newTheme;
    }
  }, [theme, isInitialized]);

  // Fit terminal when container size changes
  useEffect(() => {
    if (fitAddonRef.current && isInitialized && terminalRef.current) {
      const fitAddon = fitAddonRef.current;

      // Initial fit
      const initialFit = () => {
        fitAddon.fit();
      };

      // Use ResizeObserver to watch for container size changes if available
      if (typeof ResizeObserver !== "undefined") {
        const resizeObserver = new ResizeObserver(() => {
          // Debounce the fit call to avoid excessive calls
          setTimeout(() => {
            if (fitAddon) {
              fitAddon.fit();
            }
          }, 10);
        });

        // Observe the terminal container
        resizeObserver.observe(terminalRef.current);

        // Initial fit after a short delay to ensure DOM is ready
        setTimeout(initialFit, 100);

        // Cleanup
        return () => {
          resizeObserver.disconnect();
        };
      } else {
        // Fallback: use interval for older browsers
        setTimeout(initialFit, 100);
        const interval = setInterval(() => {
          if (fitAddon) {
            fitAddon.fit();
          }
        }, 500);

        return () => {
          clearInterval(interval);
        };
      }
    }
  }, [isInitialized]);

  // Handle window resize
  useEffect(() => {
    if (fitAddonRef.current && isInitialized) {
      const handleWindowResize = () => {
        setTimeout(() => {
          fitAddonRef.current?.fit();
        }, 50);
      };

      window.addEventListener("resize", handleWindowResize);

      return () => {
        window.removeEventListener("resize", handleWindowResize);
      };
    }
  }, [isInitialized]);

  // Trigger refit when terminal opens/closes
  useEffect(() => {
    if (fitAddonRef.current && isInitialized && isOpen) {
      // Delay to ensure the panel has finished animating
      const timeoutId = setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isInitialized]);

  if (!isOpen) return null;

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
      <div className="flex-1 overflow-hidden bg-white dark:bg-black relative">
        <div
          ref={terminalRef}
          className="absolute inset-0 w-full h-full"
          style={{
            padding: "8px",
            background: theme === "dark" ? "#000000" : "#ffffff",
          }}
        />
      </div>

      {/* Terminal Footer */}
      <div className="px-6 py-2 bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center justify-between">
          <span>
            {isInitialized ? "Terminal ready" : "Initializing terminal..."}
          </span>
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
