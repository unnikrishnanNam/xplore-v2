import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Play,
  Square,
  Trash2,
  MoreVertical,
  Monitor,
  HardDrive,
  Cpu,
  Globe,
  Settings,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Wifi,
  WifiOff,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import MultiStepDialog from "./MultiStepDialog";
import SSHConnectionDialog, { SSHCredentials } from "./SSHConnectionDialog";

interface VM {
  name: string;
  status: "running" | "shut off" | "provisioning" | "deleting" | "error";
  ip: string;
  // Additional computed fields for UI
  id?: string;
  baseImage?: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  created?: Date;
}

interface ProvisionRequest {
  name: string;
  baseImage: "jammy" | "noble" | "fedora";
  cpu: number;
  memory: number;
  disk: number;
  sshKey: string;
  sshPass: string;
}

const API_BASE = "/api";

const VMServicePage = () => {
  const [vms, setVms] = useState<VM[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceOnline, setServiceOnline] = useState(false);
  const [provisionDialog, setProvisionDialog] = useState<{
    open: boolean;
  } | null>(null);
  const [selectedVm, setSelectedVm] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    vmName: string;
  } | null>(null);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [pollingVMs, setPollingVMs] = useState<Set<string>>(new Set());
  const [sshDialog, setSSHDialog] = useState<{
    open: boolean;
    vmName: string;
    vmIP: string;
  } | null>(null);

  // Fetch VMs from API
  const fetchVMs = useCallback(async (showToast = false) => {
    try {
      console.log("Fetching VMs from:", `${API_BASE}/vm`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE}/vm`, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: { name: string; status: string; ip: string }[] =
        await response.json();
      console.log("Received VM data:", data);

      // Set service as online when we successfully fetch data
      setServiceOnline(true);

      setVms(
        data.map((vm) => ({
          ...vm,
          id: vm.name,
          status:
            vm.status === "shut off" ? "shut off" : (vm.status as VM["status"]),
          ip: vm.ip === "unavailable" ? "unavailable" : vm.ip,
        }))
      );

      if (showToast) {
        toast.success("VMs refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching VMs:", error);

      // Set service as offline when there's an error
      setServiceOnline(false);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          toast.error(
            "Request timed out. Please check if the VM service is running on localhost:8080"
          );
        } else if (
          error.message.includes("fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("Failed to fetch")
        ) {
          toast.error(
            "Cannot connect to VM service. Please ensure the service is running on localhost:8080"
          );
        } else {
          toast.error(`Failed to fetch VMs: ${error.message}`);
        }
      } else {
        toast.error("Failed to fetch VMs: Unknown error");
      }

      // Set empty VMs array on error so the UI shows the "no VMs" state
      setVms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Poll VM status during provisioning/deletion
  const pollVMStatus = useCallback(
    async (vmName: string, type: "provision" | "delete") => {
      setPollingVMs((prev) => new Set(prev).add(vmName));

      if (type === "delete") {
        // For delete operations, poll the main VM list instead
        const pollInterval = setInterval(async () => {
          try {
            await fetchVMs();
            const vmExists = vms.some((vm) => vm.name === vmName);
            if (!vmExists) {
              clearInterval(pollInterval);
              setPollingVMs((prev) => {
                const newSet = new Set(prev);
                newSet.delete(vmName);
                return newSet;
              });
              toast.success(`VM ${vmName} deleted successfully`);
            }
          } catch (error) {
            console.error("Error polling VM list:", error);
            // Continue polling even on error - might be temporary network issue
          }
        }, 3000);

        // Clean up after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setPollingVMs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(vmName);
            return newSet;
          });
          toast.info(`Stopped polling for ${vmName} deletion (timeout)`);
        }, 300000);
      } else {
        // For provision operations, poll the status endpoint
        const pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`${API_BASE}/vm/status/${vmName}`);
            if (!response.ok) {
              console.error(`Status check failed: HTTP ${response.status}`);
              return; // Continue polling
            }

            const data = await response.json();

            if (
              data.status === "success" &&
              data.state === "running" &&
              data.ip !== "unavailable"
            ) {
              clearInterval(pollInterval);
              setPollingVMs((prev) => {
                const newSet = new Set(prev);
                newSet.delete(vmName);
                return newSet;
              });
              await fetchVMs();
              toast.success(
                `VM ${vmName} provisioned successfully (IP: ${data.ip})`
              );
            }
          } catch (error) {
            console.error("Error polling VM status:", error);
            // Continue polling even on error - might be temporary network issue
          }
        }, 3000);

        // Clean up after 10 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setPollingVMs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(vmName);
            return newSet;
          });
          toast.info(`Stopped polling for ${vmName} provisioning (timeout)`);
        }, 600000);
      }
    },
    [fetchVMs, vms]
  );

  // Initial load and periodic refresh
  useEffect(() => {
    // Check service status immediately on mount
    const checkServiceStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/vm`, {
          signal: AbortSignal.timeout(5000), // 5 second timeout for initial check
        });
        if (response.ok) {
          setServiceOnline(true);
        } else {
          setServiceOnline(false);
        }
      } catch (error) {
        setServiceOnline(false);
      }
    };

    // Check service status first, then fetch VMs
    checkServiceStatus().then(() => {
      fetchVMs();
    });

    // Refresh VMs every 30 seconds
    const interval = setInterval(() => fetchVMs(), 30000);

    return () => clearInterval(interval);
  }, [fetchVMs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVMs(true);
  };

  const handleVmAction = async (
    vmName: string,
    action: "start" | "stop" | "delete"
  ) => {
    const vm = vms.find((v) => v.name === vmName);
    if (!vm) return;

    setPendingActions((prev) => new Set(prev).add(vmName));
    setContextMenu(null);

    try {
      switch (action) {
        case "start":
          if (vm.status === "shut off") {
            toast.promise(
              fetch(`${API_BASE}/vm/start/${vmName}`, { method: "POST" }).then(
                async (response) => {
                  if (!response.ok) {
                    throw new Error(
                      `HTTP ${response.status}: ${response.statusText}`
                    );
                  }
                  const data = await response.json();
                  await fetchVMs();
                  return data;
                }
              ),
              {
                loading: `Starting ${vmName}...`,
                success: (data) =>
                  `${vmName} started successfully${
                    data.ip ? ` (IP: ${data.ip})` : ""
                  }`,
                error: (err) => `Failed to start ${vmName}: ${err.message}`,
              }
            );
          }
          break;

        case "stop":
          if (vm.status === "running") {
            toast.promise(
              fetch(`${API_BASE}/vm/shutdown/${vmName}`, {
                method: "POST",
              }).then(async (response) => {
                if (!response.ok) {
                  throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                  );
                }
                const data = await response.json();
                await fetchVMs();
                return data;
              }),
              {
                loading: `Stopping ${vmName}...`,
                success: `${vmName} stopped successfully`,
                error: (err) => `Failed to stop ${vmName}: ${err.message}`,
              }
            );
          }
          break;

        case "delete":
          toast.promise(
            fetch(`${API_BASE}/vm/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vmName }),
            }).then(async (response) => {
              if (!response.ok) {
                throw new Error(
                  `HTTP ${response.status}: ${response.statusText}`
                );
              }
              // Start polling for deletion status
              pollVMStatus(vmName, "delete");
              return await response.text();
            }),
            {
              loading: `Deleting ${vmName}...`,
              success: `Delete request for ${vmName} submitted`,
              error: (err) => `Failed to delete ${vmName}: ${err.message}`,
            }
          );
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action} on VM:`, error);
      toast.error(
        `Failed to ${action} ${vmName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setPendingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(vmName);
        return newSet;
      });
    }
  };

  const handleProvisionComplete = async (values: Record<string, string>) => {
    const request: ProvisionRequest = {
      name: values.vmname,
      baseImage: values.baseImage as "jammy" | "noble" | "fedora",
      cpu: parseInt(values.cpu),
      memory: parseInt(values.memory),
      disk: parseInt(values.disk),
      sshKey: values.sshKey,
      sshPass: values.sshPass,
    };

    try {
      toast.promise(
        fetch(`${API_BASE}/vm/provision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          // Start polling for provision status
          pollVMStatus(request.name, "provision");
          return await response.text();
        }),
        {
          loading: `Provisioning ${request.name}...`,
          success: `Provision request for ${request.name} submitted`,
          error: (err) => `Failed to provision ${request.name}: ${err.message}`,
        }
      );
    } catch (error) {
      console.error("Error provisioning VM:", error);
      toast.error(
        `Failed to provision ${request.name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    setProvisionDialog(null);
  };

  const handleSSHConnection = async (credentials: SSHCredentials) => {
    try {
      // Send SSH connection details to the main process via IPC
      if (window.electronAPI) {
        // First, ensure terminal is created/visible
        await window.electronAPI.terminal.create();

        // Then establish SSH connection
        await window.electronAPI.connectSSH(credentials);
        toast.success(`SSH connection established to ${credentials.vmName}`);
      } else {
        // Fallback for development/web environment
        console.log("SSH Connection Details:", credentials);
        toast.info(
          `SSH connection simulated for ${credentials.vmName} (${credentials.vmIP})`
        );
      }
    } catch (error) {
      console.error("SSH connection failed:", error);
      toast.error(
        `Failed to connect to ${credentials.vmName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error; // Re-throw to be handled by the dialog
    }
  };

  // Handler for direct terminal icon click (bypass dialog)
  const handleDirectSSHConnection = async (vm: VM) => {
    if (vm.ip === "unavailable" || vm.status !== "running") {
      toast.error("Cannot connect to VM: No IP address available");
      return;
    }

    try {
      // For direct connection, we'll open the SSH dialog
      // In a real scenario, you might have stored credentials or use key-based auth
      setSSHDialog({
        open: true,
        vmName: vm.name,
        vmIP: vm.ip,
      });
    } catch (error) {
      console.error("Failed to initiate SSH connection:", error);
      toast.error("Failed to initiate SSH connection");
    }
  };

  const getStatusIcon = (status: VM["status"], vmName: string) => {
    const isPolling = pollingVMs.has(vmName);
    const isPending = pendingActions.has(vmName);

    if (isPolling || isPending) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }

    switch (status) {
      case "running":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "shut off":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case "provisioning":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "deleting":
        return <Loader2 className="w-4 h-4 animate-spin text-red-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: VM["status"]) => {
    switch (status) {
      case "running":
        return "text-green-600 dark:text-green-400";
      case "shut off":
        return "text-gray-600 dark:text-gray-400";
      case "provisioning":
        return "text-blue-600 dark:text-blue-400";
      case "deleting":
        return "text-red-600 dark:text-red-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const handleRightClick = (event: React.MouseEvent, vmName: string) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      vmName,
    });
  };

  const ContextMenu = () => {
    if (!contextMenu) return null;

    const vm = vms.find((v) => v.name === contextMenu.vmName);
    if (!vm) return null;

    return (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
        <div
          className="fixed z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg min-w-48 overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {vm.status === "running" && vm.ip !== "unavailable" && (
            <button
              className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              onClick={() => {
                setSSHDialog({
                  open: true,
                  vmName: contextMenu.vmName,
                  vmIP: vm.ip,
                });
                setContextMenu(null);
              }}
            >
              <Terminal className="w-4 h-4 mr-2 text-green-500" />
              SSH Connect
            </button>
          )}
          {vm.status === "running" && (
            <button
              className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              onClick={() => handleVmAction(contextMenu.vmName, "stop")}
            >
              <Square className="w-4 h-4 mr-2 text-neutral-500 dark:text-neutral-400" />
              Stop VM
            </button>
          )}
          {vm.status === "shut off" && (
            <button
              className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              onClick={() => handleVmAction(contextMenu.vmName, "start")}
            >
              <Play className="w-4 h-4 mr-2 text-neutral-500 dark:text-neutral-400" />
              Start VM
            </button>
          )}
          <button className="w-full group flex items-center text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            <Settings className="w-4 h-4 mr-2 text-neutral-500 dark:text-neutral-400" />
            Configure
          </button>
          <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-2 my-1" />
          <button
            className="w-full group flex items-center text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            onClick={() => handleVmAction(contextMenu.vmName, "delete")}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete VM
          </button>
        </div>
      </>
    );
  };

  const getProvisionSteps = () => [
    {
      id: "vmname",
      title: "VM Name",
      description: "Enter a name for your virtual machine",
      placeholder: "e.g., web-server, database-vm...",
      value: "",
      required: true,
      icon: Monitor,
      validation: (value: string) => {
        if (!value.trim()) return "VM name is required";
        if (value.length < 3) return "VM name must be at least 3 characters";
        if (!/^[a-zA-Z0-9-_]+$/.test(value))
          return "VM name can only contain letters, numbers, hyphens, and underscores";

        // Check for existing VMs
        const exists = vms.some((vm) => vm.name === value);
        if (exists) return "A VM with this name already exists";

        return null;
      },
    },
    {
      id: "baseImage",
      title: "Base Image",
      description: "Choose the operating system for your VM",
      placeholder: "jammy, noble, or fedora",
      value: "jammy",
      required: true,
      icon: Server,
      validation: (value: string) => {
        if (!value.trim()) return "Base image is required";
        const validImages = ["jammy", "noble", "fedora"];
        if (!validImages.includes(value.toLowerCase())) {
          return `Base image must be one of: ${validImages.join(", ")}`;
        }
        return null;
      },
    },
    {
      id: "cpu",
      title: "CPU Cores",
      description: "Number of CPU cores for the VM",
      placeholder: "1, 2, 4, 8...",
      value: "1",
      required: true,
      icon: Cpu,
      validation: (value: string) => {
        if (!value.trim()) return "CPU count is required";
        const cpu = parseInt(value);
        if (isNaN(cpu) || cpu < 1 || cpu > 16) {
          return "CPU count must be between 1 and 16";
        }
        return null;
      },
    },
    {
      id: "memory",
      title: "Memory (MB)",
      description: "Amount of RAM in megabytes",
      placeholder: "1024, 2048, 4096...",
      value: "2048",
      required: true,
      icon: HardDrive,
      validation: (value: string) => {
        if (!value.trim()) return "Memory is required";
        const memory = parseInt(value);
        if (isNaN(memory) || memory < 512 || memory > 32768) {
          return "Memory must be between 512 MB and 32 GB";
        }
        return null;
      },
    },
    {
      id: "disk",
      title: "Disk Space (GB)",
      description: "Amount of disk space in gigabytes",
      placeholder: "10, 20, 50...",
      value: "10",
      required: true,
      icon: HardDrive,
      validation: (value: string) => {
        if (!value.trim()) return "Disk space is required";
        const disk = parseInt(value);
        if (isNaN(disk) || disk < 5 || disk > 500) {
          return "Disk space must be between 5 GB and 500 GB";
        }
        return null;
      },
    },
    {
      id: "sshKey",
      title: "SSH Username",
      description: "Username for SSH access to the VM",
      placeholder: "Enter SSH username...",
      value: "",
      required: true,
      icon: Globe,
      validation: (value: string) => {
        if (!value.trim()) return "SSH username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
        return null;
      },
    },
    {
      id: "sshPass",
      title: "SSH Password",
      description: "Password for SSH access to the VM",
      placeholder: "Enter SSH password...",
      value: "",
      required: true,
      icon: Globe,
      validation: (value: string) => {
        if (!value.trim()) return "SSH password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 bg-white dark:bg-neutral-950 overflow-hidden flex flex-col">
        <div className="bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  VM Service
                </h1>
                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />
                <span className="text-xs font-medium text-neutral-500">
                  Connecting...
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1 text-sm sm:text-base">
                Manage your virtual machines
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Loading VMs...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-neutral-950 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                VM Service
              </h1>
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  serviceOnline ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  serviceOnline
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {serviceOnline ? "Online" : "Offline"}
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1 text-sm sm:text-base">
              Manage your virtual machines
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${API_BASE}/vm`);
                  if (response.ok) {
                    setServiceOnline(true);
                    toast.success("VM service is accessible");
                  } else {
                    setServiceOnline(false);
                    toast.error(`VM service responded with ${response.status}`);
                  }
                } catch (error) {
                  setServiceOnline(false);
                  toast.error("Cannot reach VM service");
                  console.error("Connectivity test failed:", error);
                }
              }}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium px-3 sm:px-4 py-2 rounded-md shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 text-sm"
            >
              <Globe className="w-4 h-4" />
              <span>Test API</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium px-3 sm:px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <RefreshCw
                className={cn("w-4 h-4", refreshing && "animate-spin")}
              />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setProvisionDialog({ open: true })}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-3 sm:px-4 py-2 rounded-md shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Provision VM</span>
            </button>
          </div>
        </div>
      </div>

      {/* VM Grid */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {vms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Monitor className="w-12 h-12 text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              No Virtual Machines
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-sm sm:text-base">
              Get started by provisioning your first VM
            </p>
            <button
              onClick={() => setProvisionDialog({ open: true })}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-md shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
            >
              <Plus className="w-4 h-4" />
              <span>Provision VM</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {vms.map((vm) => (
              <div
                key={vm.name}
                className={cn(
                  "bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:shadow-lg transition-all cursor-pointer",
                  selectedVm === vm.name &&
                    "ring-2 ring-neutral-500 dark:ring-neutral-400"
                )}
                onClick={() =>
                  setSelectedVm(selectedVm === vm.name ? null : vm.name)
                }
                onContextMenu={(e) => handleRightClick(e, vm.name)}
              >
                {/* VM Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {vm.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(vm.status, vm.name)}
                      <span
                        className={cn(
                          "text-xs font-medium capitalize",
                          getStatusColor(vm.status)
                        )}
                      >
                        {vm.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRightClick(e, vm.name);
                    }}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>

                {/* IP Address */}
                <div className="flex items-center space-x-2 mb-3">
                  {vm.ip === "unavailable" ? (
                    <WifiOff className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <Wifi className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    {vm.ip === "unavailable" ? "No IP assigned" : vm.ip}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center space-x-1">
                    {vm.status === "running" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectSSHConnection(vm);
                          }}
                          disabled={vm.ip === "unavailable"}
                          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-50"
                          title="SSH Connect"
                        >
                          <Terminal className="w-4 h-4 text-green-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVmAction(vm.name, "stop");
                          }}
                          disabled={pendingActions.has(vm.name)}
                          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-50"
                          title="Stop VM"
                        >
                          <Square className="w-4 h-4 text-neutral-500" />
                        </button>
                      </>
                    )}
                    {vm.status === "shut off" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVmAction(vm.name, "start");
                        }}
                        disabled={pendingActions.has(vm.name)}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-50"
                        title="Start VM"
                      >
                        <Play className="w-4 h-4 text-green-500" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {vm.baseImage || "Unknown"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContextMenu />

      {/* Provision VM Dialog */}
      {provisionDialog && (
        <MultiStepDialog
          open={provisionDialog.open}
          onOpenChange={(open) =>
            setProvisionDialog(open ? provisionDialog : null)
          }
          title="Provision New Virtual Machine"
          steps={getProvisionSteps()}
          onComplete={handleProvisionComplete}
        />
      )}

      {/* SSH Connection Dialog */}
      {sshDialog && (
        <SSHConnectionDialog
          open={sshDialog.open}
          onOpenChange={(open) => setSSHDialog(open ? sshDialog : null)}
          vmName={sshDialog.vmName}
          vmIP={sshDialog.vmIP}
          onConnect={handleSSHConnection}
        />
      )}
    </div>
  );
};

export default VMServicePage;
