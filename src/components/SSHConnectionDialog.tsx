import { useState } from "react";
import { Terminal, User, Key, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

interface SSHConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vmName: string;
  vmIP: string;
  onConnect: (credentials: SSHCredentials) => void;
}

export interface SSHCredentials {
  username: string;
  password: string;
  vmName: string;
  vmIP: string;
}

const SSHConnectionDialog = ({
  open,
  onOpenChange,
  vmName,
  vmIP,
  onConnect,
}: SSHConnectionDialogProps) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const validateForm = () => {
    const newErrors = {
      username: "",
      password: "",
    };

    if (!credentials.username.trim()) {
      newErrors.username = "Username is required";
    } else if (credentials.username.length < 2) {
      newErrors.username = "Username must be at least 2 characters";
    }

    if (!credentials.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return !newErrors.username && !newErrors.password;
  };

  const handleConnect = async () => {
    if (!validateForm()) return;

    setIsConnecting(true);
    try {
      const sshCredentials: SSHCredentials = {
        username: credentials.username,
        password: credentials.password,
        vmName,
        vmIP,
      };

      await onConnect(sshCredentials);
      onOpenChange(false);

      // Reset form
      setCredentials({ username: "", password: "" });
      setErrors({ username: "", password: "" });
    } catch (error) {
      console.error("SSH connection failed:", error);
      toast.error("Failed to establish SSH connection");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInputChange = (field: "username" | "password", value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center space-x-3 p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Terminal className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              SSH Connection
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Connect to {vmName} ({vmIP})
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <User className="w-4 h-4" />
              <span>Username</span>
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="Enter SSH username..."
              className={cn(
                "w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                errors.username
                  ? "border-red-300 dark:border-red-600"
                  : "border-neutral-300 dark:border-neutral-600"
              )}
              disabled={isConnecting}
            />
            {errors.username && (
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.username}</span>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <Key className="w-4 h-4" />
              <span>Password</span>
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Enter SSH password..."
              className={cn(
                "w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                errors.password
                  ? "border-red-300 dark:border-red-600"
                  : "border-neutral-300 dark:border-neutral-600"
              )}
              disabled={isConnecting}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleConnect();
                }
              }}
            />
            {errors.password && (
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Make sure SSH service is running on the VM
              and the credentials are correct.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            disabled={isConnecting}
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={
              isConnecting ||
              !credentials.username.trim() ||
              !credentials.password.trim()
            }
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                <span>Connect</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SSHConnectionDialog;
