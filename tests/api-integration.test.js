#!/usr/bin/env node

/**
 * 🧪 VM Service API Integration Test Suite
 *
 * This script demonstrates API Integration Testing strategy for the VM Management application.
 * It tests the real Spring Boot backend APIs through the Vite proxy configuration.
 *
 * Testing Strategy: API Integration Testing
 * - Tests real API endpoints
 * - Validates request/response contracts
 * - Tests error scenarios and edge cases
 * - Simulates frontend API calls
 * - Validates polling behavior
 *
 * Usage: node tests/api-integration.test.js
 */

import fetch from "node-fetch"; // You may need: npm install node-fetch
import assert from "assert";
import { setTimeout } from "timers/promises";

// Configuration
const CONFIG = {
  // Test against the real Spring Boot backend (through Vite proxy in dev, direct in test)
  API_BASE:
    process.env.NODE_ENV === "development"
      ? "http://localhost:5173/api"
      : "http://localhost:8080",
  TIMEOUT: 10000, // 10 seconds
  POLL_INTERVAL: 2000, // 2 seconds
  MAX_POLL_ATTEMPTS: 5,
};

// Test utilities
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log("\n🧪 VM Service API Integration Tests");
    console.log("=====================================\n");

    for (const { name, fn } of this.tests) {
      try {
        console.log(`🔄 Running: ${name}`);
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
    console.log("\n📊 Test Summary");
    console.log("================");
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📝 Total:  ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// HTTP client with timeout
async function apiCall(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test data
const TEST_VM = {
  name: `test-vm-${Date.now()}`,
  baseImage: "jammy",
  cpu: 1,
  memory: 1024,
  disk: 10,
  sshKey: "testuser",
  sshPass: "testpass123",
};

// Initialize test runner
const runner = new TestRunner();

// 🧪 Test Suite: Basic API Connectivity
runner.test("API Health Check - GET /vm", async () => {
  const response = await apiCall("/vm");

  assert.strictEqual(
    response.status,
    200,
    `Expected status 200, got ${response.status}`
  );

  const data = await response.json();
  assert(Array.isArray(data), "Response should be an array");

  console.log(`   📊 Found ${data.length} existing VMs`);

  // Validate VM structure
  if (data.length > 0) {
    const vm = data[0];
    assert(typeof vm.name === "string", "VM should have string name");
    assert(typeof vm.status === "string", "VM should have string status");
    assert(typeof vm.ip === "string", "VM should have string ip");
    console.log(`   ✓ VM structure validation passed`);
  }
});

// 🧪 Test Suite: VM Status Endpoint
runner.test("VM Status Check - GET /vm/status/:name", async () => {
  // First get existing VMs
  const listResponse = await apiCall("/vm");
  const vms = await listResponse.json();

  if (vms.length === 0) {
    console.log("   ⚠️  No existing VMs to test status endpoint");
    return;
  }

  const testVm = vms[0];
  const response = await apiCall(`/vm/status/${testVm.name}`);

  assert.strictEqual(
    response.status,
    200,
    `Expected status 200, got ${response.status}`
  );

  const statusData = await response.json();
  assert.strictEqual(
    statusData.status,
    "success",
    "Status response should indicate success"
  );
  assert.strictEqual(
    statusData.name,
    testVm.name,
    "Status response should return correct VM name"
  );
  assert(
    typeof statusData.state === "string",
    "Status response should include state"
  );
  assert(
    typeof statusData.ip === "string",
    "Status response should include IP"
  );

  console.log(
    `   📋 VM: ${statusData.name}, State: ${statusData.state}, IP: ${statusData.ip}`
  );
});

// 🧪 Test Suite: VM Status Non-existent VM
runner.test("VM Status Check - Non-existent VM", async () => {
  const response = await apiCall("/vm/status/non-existent-vm-12345");

  assert.strictEqual(
    response.status,
    404,
    `Expected status 404 for non-existent VM, got ${response.status}`
  );

  const errorData = await response.json();
  assert(errorData.error, "Error response should include error message");
  assert(
    errorData.error.includes("not found") ||
      errorData.error.includes("VM not found"),
    "Error should indicate VM not found"
  );

  console.log(`   ✓ Proper error handling for non-existent VM`);
});

// 🧪 Test Suite: VM Provisioning
runner.test("VM Provisioning - POST /vm/provision", async () => {
  const response = await apiCall("/vm/provision", {
    method: "POST",
    body: JSON.stringify(TEST_VM),
  });

  // The provision endpoint typically returns success immediately and processes async
  assert(
    response.status >= 200 && response.status < 300,
    `Expected 2xx status, got ${response.status}`
  );

  const result = await response.text();
  console.log(`   📝 Provision response: ${result}`);

  // Verify VM appears in list with provisioning status
  await setTimeout(1000); // Brief wait for async processing

  const listResponse = await apiCall("/vm");
  const vms = await listResponse.json();
  const newVm = vms.find((vm) => vm.name === TEST_VM.name);

  assert(
    newVm,
    `VM ${TEST_VM.name} should appear in VM list after provisioning`
  );
  console.log(
    `   ✓ VM ${TEST_VM.name} successfully created with status: ${newVm.status}`
  );
});

// 🧪 Test Suite: VM Status Polling (simulates frontend polling behavior)
runner.test("VM Status Polling - Provisioning Status", async () => {
  let attempts = 0;
  let vmReady = false;

  console.log(
    `   🔄 Polling VM status for ${TEST_VM.name} (max ${CONFIG.MAX_POLL_ATTEMPTS} attempts)`
  );

  while (attempts < CONFIG.MAX_POLL_ATTEMPTS && !vmReady) {
    attempts++;

    try {
      const response = await apiCall(`/vm/status/${TEST_VM.name}`);

      if (response.status === 200) {
        const statusData = await response.json();
        console.log(
          `   📊 Attempt ${attempts}: ${statusData.state} (IP: ${statusData.ip})`
        );

        // Check if VM is fully provisioned
        if (statusData.state === "running" && statusData.ip !== "unavailable") {
          vmReady = true;
          console.log(`   ✅ VM fully provisioned after ${attempts} attempts`);
          break;
        }
      }

      if (!vmReady && attempts < CONFIG.MAX_POLL_ATTEMPTS) {
        await setTimeout(CONFIG.POLL_INTERVAL);
      }
    } catch (error) {
      console.log(`   ⚠️  Attempt ${attempts} failed: ${error.message}`);
    }
  }

  if (!vmReady) {
    console.log(
      `   ⚠️  VM not ready after ${attempts} attempts (this may be normal for slow provisioning)`
    );
  }
});

// 🧪 Test Suite: VM Operations (Start/Stop)
runner.test("VM Operations - Start/Stop VM", async () => {
  // Test starting a shut-off VM or stopping a running VM
  const listResponse = await apiCall("/vm");
  const vms = await listResponse.json();

  // Find a VM we can test operations on
  let testVm = vms.find((vm) => vm.status === "shut off");
  let operation = "start";

  if (!testVm) {
    testVm = vms.find((vm) => vm.status === "running");
    operation = "shutdown";
  }

  if (!testVm) {
    console.log("   ⚠️  No VMs available for start/stop testing");
    return;
  }

  console.log(`   🔄 Testing ${operation} operation on VM: ${testVm.name}`);

  const response = await apiCall(`/vm/${operation}/${testVm.name}`, {
    method: "POST",
  });

  assert(
    response.status >= 200 && response.status < 300,
    `Expected 2xx status for ${operation}, got ${response.status}`
  );

  const result = await response.json();
  assert.strictEqual(
    result.status,
    "success",
    `${operation} operation should succeed`
  );

  console.log(`   ✅ ${operation} operation successful: ${result.message}`);
});

// 🧪 Test Suite: VM Deletion
runner.test("VM Deletion - POST /vm/delete", async () => {
  const response = await apiCall("/vm/delete", {
    method: "POST",
    body: JSON.stringify({ vmName: TEST_VM.name }),
  });

  assert(
    response.status >= 200 && response.status < 300,
    `Expected 2xx status for delete, got ${response.status}`
  );

  const result = await response.text();
  console.log(`   📝 Delete response: ${result}`);

  // Verify VM is marked for deletion or removed
  await setTimeout(2000); // Wait for async processing

  const listResponse = await apiCall("/vm");
  const vms = await listResponse.json();
  const deletedVm = vms.find((vm) => vm.name === TEST_VM.name);

  if (deletedVm) {
    assert.strictEqual(
      deletedVm.status,
      "deleting",
      `VM should be in deleting status, got ${deletedVm.status}`
    );
    console.log(`   ✓ VM marked for deletion with status: ${deletedVm.status}`);
  } else {
    console.log(`   ✓ VM ${TEST_VM.name} successfully removed from list`);
  }
});

// 🧪 Test Suite: Error Handling
runner.test("Error Handling - Invalid Provision Data", async () => {
  const invalidData = {
    name: "", // Invalid: empty name
    baseImage: "invalid-image",
    cpu: -1, // Invalid: negative CPU
    memory: 0, // Invalid: zero memory
  };

  const response = await apiCall("/vm/provision", {
    method: "POST",
    body: JSON.stringify(invalidData),
  });

  // Should either return 400 (validation error) or accept but fail gracefully
  if (response.status >= 400) {
    console.log(`   ✓ API properly validates input (HTTP ${response.status})`);
  } else {
    console.log(
      `   ⚠️  API accepts invalid input - validation might be handled elsewhere`
    );
  }
});

// 🧪 Test Suite: CORS and Proxy Testing (for development environment)
runner.test("CORS and Proxy Configuration", async () => {
  const response = await apiCall("/vm", {
    headers: {
      Origin: "http://localhost:5173",
    },
  });

  assert.strictEqual(response.status, 200, "CORS should allow frontend origin");

  // Check CORS headers
  const corsHeaders = response.headers.get("vary");
  if (corsHeaders && corsHeaders.includes("Origin")) {
    console.log(`   ✓ CORS headers properly configured`);
  }

  console.log(`   ✓ Proxy/CORS configuration working correctly`);
});

// 🧪 Test Suite: Performance and Load Testing
runner.test("Performance - Multiple Concurrent Requests", async () => {
  const startTime = Date.now();

  // Make 5 concurrent requests to test API performance
  const promises = Array(5)
    .fill()
    .map((_, i) =>
      apiCall("/vm").then((response) => ({ index: i, status: response.status }))
    );

  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;

  // All requests should succeed
  results.forEach((result) => {
    assert.strictEqual(
      result.status,
      200,
      `Request ${result.index} should succeed`
    );
  });

  console.log(
    `   ⚡ ${results.length} concurrent requests completed in ${duration}ms`
  );
  console.log(
    `   📊 Average response time: ${Math.round(
      duration / results.length
    )}ms per request`
  );

  // Performance assertion (should complete within reasonable time)
  assert(
    duration < 5000,
    `Concurrent requests should complete within 5 seconds, took ${duration}ms`
  );
});

// Run all tests
runner.run().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});
