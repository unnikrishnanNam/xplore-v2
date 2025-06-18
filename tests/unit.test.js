/**
 * 🧪 VM Service Component Unit Tests
 *
 * This script demonstrates Unit Testing strategy for React components.
 * It tests individual component logic, validation functions, and utilities.
 *
 * Testing Strategy: Unit Testing
 * - Tests pure functions in isolation
 * - Validates form validation logic
 * - Tests utility functions
 * - Tests component state management
 * - Fast execution and no external dependencies
 *
 * Usage: node tests/unit.test.js
 */

import assert from "assert";
import process from "process";

// Test utilities
class UnitTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log("\n🔬 VM Service Unit Tests");
    console.log("========================\n");

    for (const { name, fn } of this.tests) {
      try {
        console.log(`🔄 Testing: ${name}`);
        await fn();
        console.log(`✅ PASSED: ${name}\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log("\n📊 Unit Test Summary");
    console.log("====================");
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📝 Total:  ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// 🧪 Mock: VM Service Page validation functions (extracted from actual component)
const vmValidation = {
  validateVmName: (value, existingVms = []) => {
    if (!value.trim()) return "VM name is required";
    if (value.length < 3) return "VM name must be at least 3 characters";
    if (!/^[a-zA-Z0-9-_]+$/.test(value))
      return "VM name can only contain letters, numbers, hyphens, and underscores";

    const exists = existingVms.some((vm) => vm.name === value);
    if (exists) return "A VM with this name already exists";

    return null;
  },

  validateBaseImage: (value) => {
    if (!value.trim()) return "Base image is required";
    const validImages = ["jammy", "noble", "fedora"];
    if (!validImages.includes(value.toLowerCase())) {
      return `Base image must be one of: ${validImages.join(", ")}`;
    }
    return null;
  },

  validateCpu: (value) => {
    if (!value.trim()) return "CPU count is required";
    const cpu = parseInt(value);
    if (isNaN(cpu) || cpu < 1 || cpu > 16) {
      return "CPU count must be between 1 and 16";
    }
    return null;
  },

  validateMemory: (value) => {
    if (!value.trim()) return "Memory is required";
    const memory = parseInt(value);
    if (isNaN(memory) || memory < 512 || memory > 32768) {
      return "Memory must be between 512 MB and 32 GB";
    }
    return null;
  },

  validateDisk: (value) => {
    if (!value.trim()) return "Disk space is required";
    const disk = parseInt(value);
    if (isNaN(disk) || disk < 5 || disk > 500) {
      return "Disk space must be between 5 GB and 500 GB";
    }
    return null;
  },

  validateSshCredentials: (username, password) => {
    const errors = {};

    if (!username.trim()) {
      errors.username = "SSH username is required";
    } else if (username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!password.trim()) {
      errors.password = "SSH password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  },
};

// 🧪 Mock: VM Status utilities
const vmUtils = {
  getStatusColor: (status) => {
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
  },

  isVmActionable: (vm) => {
    return vm.status === "running" || vm.status === "shut off";
  },

  canConnectSSH: (vm) => {
    return vm.status === "running" && vm.ip !== "unavailable";
  },

  formatVmData: (rawVm) => {
    return {
      ...rawVm,
      id: rawVm.name,
      status: rawVm.status === "shut off" ? "shut off" : rawVm.status,
      ip: rawVm.ip === "unavailable" ? "unavailable" : rawVm.ip,
    };
  },

  generateRandomIP: () => {
    return `192.168.122.${Math.floor(Math.random() * 200) + 50}`;
  },

  isValidIP: (ip) => {
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ip === "unavailable" || ipRegex.test(ip);
  },
};

// 🧪 Mock: API response parser
const apiUtils = {
  parseVmListResponse: (data) => {
    if (!Array.isArray(data)) {
      throw new Error("VM list response must be an array");
    }

    return data.map(vmUtils.formatVmData);
  },

  parseStatusResponse: (data, expectedVmName) => {
    if (data.status !== "success") {
      throw new Error(`Status check failed: ${data.error || "Unknown error"}`);
    }

    if (data.name !== expectedVmName) {
      throw new Error(
        `Status response VM name mismatch: expected ${expectedVmName}, got ${data.name}`
      );
    }

    return {
      name: data.name,
      status: data.state === "shut_off" ? "shut off" : data.state,
      ip: data.ip,
    };
  },

  buildProvisionRequest: (formData) => {
    return {
      name: formData.vmname,
      baseImage: formData.baseImage,
      cpu: parseInt(formData.cpu),
      memory: parseInt(formData.memory),
      disk: parseInt(formData.disk),
      sshKey: formData.sshKey,
      sshPass: formData.sshPass,
    };
  },
};

// Initialize test runner
const runner = new UnitTestRunner();

// 🧪 Unit Tests: VM Name Validation
runner.test("VM Name Validation - Valid names", () => {
  const validNames = ["test-vm", "WebServer_1", "database123", "my-awesome-vm"];

  validNames.forEach((name) => {
    const result = vmValidation.validateVmName(name);
    assert.strictEqual(result, null, `"${name}" should be valid`);
  });

  console.log(`   ✓ Tested ${validNames.length} valid VM names`);
});

runner.test("VM Name Validation - Invalid names", () => {
  const invalidCases = [
    { name: "", expectedError: "VM name is required" },
    { name: "  ", expectedError: "VM name is required" },
    { name: "ab", expectedError: "VM name must be at least 3 characters" },
    {
      name: "test/vm",
      expectedError:
        "VM name can only contain letters, numbers, hyphens, and underscores",
    },
    {
      name: "test vm",
      expectedError:
        "VM name can only contain letters, numbers, hyphens, and underscores",
    },
    {
      name: "test@vm",
      expectedError:
        "VM name can only contain letters, numbers, hyphens, and underscores",
    },
  ];

  invalidCases.forEach(({ name, expectedError }) => {
    const result = vmValidation.validateVmName(name);
    assert(result !== null, `"${name}" should be invalid`);
    assert(
      result.includes(expectedError.split(" ")[0]),
      `"${name}" should return appropriate error`
    );
  });

  console.log(`   ✓ Tested ${invalidCases.length} invalid VM names`);
});

runner.test("VM Name Validation - Duplicate detection", () => {
  const existingVms = [{ name: "existing-vm-1" }, { name: "existing-vm-2" }];

  // Test duplicate
  const duplicateResult = vmValidation.validateVmName(
    "existing-vm-1",
    existingVms
  );
  assert(duplicateResult !== null, "Duplicate VM name should be invalid");
  assert(
    duplicateResult.includes("already exists"),
    "Should indicate duplicate"
  );

  // Test unique
  const uniqueResult = vmValidation.validateVmName("new-vm", existingVms);
  assert.strictEqual(uniqueResult, null, "Unique VM name should be valid");

  console.log("   ✓ Duplicate detection working correctly");
});

// 🧪 Unit Tests: Base Image Validation
runner.test("Base Image Validation", () => {
  const validImages = ["jammy", "noble", "fedora", "JAMMY", "Noble"];
  const invalidImages = ["ubuntu", "centos", "", "  ", "invalid-image"];

  validImages.forEach((image) => {
    const result = vmValidation.validateBaseImage(image);
    assert.strictEqual(result, null, `"${image}" should be valid`);
  });

  invalidImages.forEach((image) => {
    const result = vmValidation.validateBaseImage(image);
    assert(result !== null, `"${image}" should be invalid`);
  });

  console.log(
    `   ✓ Tested ${validImages.length} valid and ${invalidImages.length} invalid base images`
  );
});

// 🧪 Unit Tests: Resource Validation
runner.test("CPU Validation", () => {
  const validCpus = ["1", "2", "4", "8", "16"];
  const invalidCpus = ["", "0", "-1", "17", "abc", "1.5"];

  validCpus.forEach((cpu) => {
    const result = vmValidation.validateCpu(cpu);
    assert.strictEqual(result, null, `CPU "${cpu}" should be valid`);
  });

  invalidCpus.forEach((cpu) => {
    const result = vmValidation.validateCpu(cpu);
    assert(result !== null, `CPU "${cpu}" should be invalid`);
  });

  console.log(`   ✓ CPU validation working correctly`);
});

runner.test("Memory Validation", () => {
  const validMemory = ["512", "1024", "2048", "4096", "32768"];
  const invalidMemory = ["", "0", "256", "65536", "abc"];

  validMemory.forEach((memory) => {
    const result = vmValidation.validateMemory(memory);
    assert.strictEqual(result, null, `Memory "${memory}" should be valid`);
  });

  invalidMemory.forEach((memory) => {
    const result = vmValidation.validateMemory(memory);
    assert(result !== null, `Memory "${memory}" should be invalid`);
  });

  console.log(`   ✓ Memory validation working correctly`);
});

// 🧪 Unit Tests: SSH Credentials Validation
runner.test("SSH Credentials Validation", () => {
  const validCredentials = [
    { username: "admin", password: "password123" },
    { username: "user123", password: "securepass" },
    { username: "test-user", password: "123456" },
  ];

  const invalidCredentials = [
    { username: "", password: "password123", expectError: "username" },
    { username: "ab", password: "password123", expectError: "username" },
    { username: "admin", password: "", expectError: "password" },
    { username: "admin", password: "12345", expectError: "password" },
    { username: "", password: "", expectError: "both" },
  ];

  validCredentials.forEach(({ username, password }) => {
    const result = vmValidation.validateSshCredentials(username, password);
    assert.strictEqual(
      result,
      null,
      `Credentials "${username}:${password}" should be valid`
    );
  });

  invalidCredentials.forEach(({ username, password, expectError }) => {
    const result = vmValidation.validateSshCredentials(username, password);
    assert(
      result !== null,
      `Credentials "${username}:${password}" should be invalid`
    );

    if (expectError === "username" || expectError === "both") {
      assert(result.username, "Should have username error");
    }
    if (expectError === "password" || expectError === "both") {
      assert(result.password, "Should have password error");
    }
  });

  console.log(`   ✓ SSH credentials validation working correctly`);
});

// 🧪 Unit Tests: VM Utilities
runner.test("VM Status Colors", () => {
  const statusColors = {
    running: "text-green-600",
    "shut off": "text-gray-600",
    provisioning: "text-blue-600",
    deleting: "text-red-600",
    error: "text-red-600",
    unknown: "text-gray-600",
  };

  Object.entries(statusColors).forEach(([status, expectedColor]) => {
    const color = vmUtils.getStatusColor(status);
    assert(
      color.includes(expectedColor),
      `Status "${status}" should have color containing "${expectedColor}"`
    );
  });

  console.log("   ✓ Status color mapping working correctly");
});

runner.test("VM Action Availability", () => {
  const testVms = [
    { status: "running", shouldBeActionable: true },
    { status: "shut off", shouldBeActionable: true },
    { status: "provisioning", shouldBeActionable: false },
    { status: "deleting", shouldBeActionable: false },
    { status: "error", shouldBeActionable: false },
  ];

  testVms.forEach(({ status, shouldBeActionable }) => {
    const vm = { status };
    const isActionable = vmUtils.isVmActionable(vm);
    assert.strictEqual(
      isActionable,
      shouldBeActionable,
      `VM with status "${status}" actionable state should be ${shouldBeActionable}`
    );
  });

  console.log("   ✓ VM action availability logic working correctly");
});

runner.test("SSH Connection Availability", () => {
  const testVms = [
    { status: "running", ip: "192.168.1.100", canConnect: true },
    { status: "running", ip: "unavailable", canConnect: false },
    { status: "shut off", ip: "192.168.1.100", canConnect: false },
    { status: "provisioning", ip: "192.168.1.100", canConnect: false },
  ];

  testVms.forEach(({ status, ip, canConnect }) => {
    const vm = { status, ip };
    const result = vmUtils.canConnectSSH(vm);
    assert.strictEqual(
      result,
      canConnect,
      `VM with status "${status}" and IP "${ip}" SSH availability should be ${canConnect}`
    );
  });

  console.log("   ✓ SSH connection availability logic working correctly");
});

// 🧪 Unit Tests: API Response Parsing
runner.test("VM List Response Parsing", () => {
  const mockResponse = [
    { name: "vm1", status: "running", ip: "192.168.1.100" },
    { name: "vm2", status: "shut off", ip: "unavailable" },
    { name: "vm3", status: "provisioning", ip: "unavailable" },
  ];

  const parsed = apiUtils.parseVmListResponse(mockResponse);

  assert.strictEqual(parsed.length, 3, "Should parse all VMs");
  assert.strictEqual(parsed[0].id, "vm1", "Should add ID field");
  assert.strictEqual(parsed[1].status, "shut off", "Should normalize status");

  console.log("   ✓ VM list response parsing working correctly");
});

runner.test("Status Response Parsing", () => {
  const mockStatusResponse = {
    status: "success",
    name: "test-vm",
    state: "running",
    ip: "192.168.1.100",
  };

  const parsed = apiUtils.parseStatusResponse(mockStatusResponse, "test-vm");

  assert.strictEqual(parsed.name, "test-vm", "Should preserve VM name");
  assert.strictEqual(parsed.status, "running", "Should map state to status");
  assert.strictEqual(parsed.ip, "192.168.1.100", "Should preserve IP");

  // Test shut_off state mapping
  const shutOffResponse = { ...mockStatusResponse, state: "shut_off" };
  const shutOffParsed = apiUtils.parseStatusResponse(
    shutOffResponse,
    "test-vm"
  );
  assert.strictEqual(
    shutOffParsed.status,
    "shut off",
    'Should map shut_off to "shut off"'
  );

  console.log("   ✓ Status response parsing working correctly");
});

runner.test("Provision Request Building", () => {
  const formData = {
    vmname: "test-vm",
    baseImage: "jammy",
    cpu: "2",
    memory: "2048",
    disk: "20",
    sshKey: "admin",
    sshPass: "password123",
  };

  const request = apiUtils.buildProvisionRequest(formData);

  assert.strictEqual(request.name, "test-vm", "Should map vmname to name");
  assert.strictEqual(request.cpu, 2, "Should convert CPU to number");
  assert.strictEqual(request.memory, 2048, "Should convert memory to number");
  assert.strictEqual(request.disk, 20, "Should convert disk to number");
  assert.strictEqual(request.sshKey, "admin", "Should preserve SSH key");

  console.log("   ✓ Provision request building working correctly");
});

// 🧪 Unit Tests: Utility Functions
runner.test("IP Address Validation", () => {
  const validIPs = [
    "192.168.1.1",
    "10.0.0.1",
    "172.16.0.1",
    "255.255.255.255",
    "unavailable",
  ];
  const invalidIPs = [
    "999.999.999.999",
    "192.168.1",
    "not-an-ip",
    "192.168.1.256",
  ];

  validIPs.forEach((ip) => {
    const isValid = vmUtils.isValidIP(ip);
    assert.strictEqual(isValid, true, `"${ip}" should be valid`);
  });

  invalidIPs.forEach((ip) => {
    const isValid = vmUtils.isValidIP(ip);
    assert.strictEqual(isValid, false, `"${ip}" should be invalid`);
  });

  console.log("   ✓ IP address validation working correctly");
});

runner.test("Random IP Generation", () => {
  const generatedIPs = Array(10)
    .fill()
    .map(() => vmUtils.generateRandomIP());

  generatedIPs.forEach((ip) => {
    assert(vmUtils.isValidIP(ip), `Generated IP "${ip}" should be valid`);
    assert(
      ip.startsWith("192.168.122."),
      `Generated IP "${ip}" should be in correct subnet`
    );

    const lastOctet = parseInt(ip.split(".")[3]);
    assert(
      lastOctet >= 50 && lastOctet <= 249,
      `Last octet should be in range 50-249, got ${lastOctet}`
    );
  });

  console.log(`   ✓ Generated and validated ${generatedIPs.length} random IPs`);
});

// Run all unit tests
runner.run().catch((error) => {
  console.error("❌ Unit test suite failed:", error);
  process.exit(1);
});
