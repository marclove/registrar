import { expect, test } from "bun:test";
import { spawn } from "node:child_process";

interface TestResult {
  code: number;
  stdout?: string;
  stderr: string;
}

test("script should require a diff argument", async () => {
  const result = await new Promise<TestResult>((resolve) => {
    const child = spawn("bun", ["index.ts"], { stdio: "pipe" });
    let stderr = "";

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ code: code || 0, stderr });
    });
  });

  expect(result.code).toBe(1);
  expect(result.stderr).toContain(
    "Please provide a diff as a command-line argument",
  );
});

test("config loading should work with defaults", async () => {
  // Test that the config loads without errors when no config file exists
  const result = await new Promise<TestResult>((resolve) => {
    const child = spawn("bun", ["index.ts", "test diff"], {
      stdio: "pipe",
      env: { ...process.env, ANTHROPIC_API_KEY: "test-key" },
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ code: code || 0, stdout, stderr });
    });
  });

  // Will fail due to invalid API key, but should not be exit code 1 (missing diff)
  // Exit code 1 is specifically for missing diff argument
  expect(result.stderr).not.toContain(
    "Please provide a diff as a command-line argument",
  );
});

test("built script should be executable", async () => {
  // First build the project
  const buildResult = await new Promise<TestResult>((resolve) => {
    const child = spawn("bun", ["run", "build"], { stdio: "pipe" });
    let stderr = "";

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ code: code || 0, stderr });
    });
  });

  expect(buildResult.code).toBe(0);

  // Then test the built script
  const result = await new Promise<TestResult>((resolve) => {
    const child = spawn("node", ["dist/index.js"], { stdio: "pipe" });
    let stderr = "";

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ code: code || 0, stderr });
    });
  });

  expect(result.code).toBe(1);
  expect(result.stderr).toContain(
    "Please provide a diff as a command-line argument",
  );
});

test("integration test with real API key", async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("test-") || apiKey === "test-key") {
    console.log("Skipping integration test - valid ANTHROPIC_API_KEY not set");
    return;
  }

  const testDiff = `diff --git a/src/utils.ts b/src/utils.ts
index 1234567..abcdefg 100644
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -1,3 +1,6 @@
+export function add(a: number, b: number): number {
+  return a + b;
+}
+
 export function multiply(x: number, y: number): number {
   return x * y;
 }`;

  // Test with TypeScript source directly since dependencies are available
  const result = await new Promise<TestResult>((resolve) => {
    const child = spawn("bun", ["index.ts", testDiff], {
      stdio: "pipe",
      env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ code: code || 0, stdout, stderr });
    });
  });

  if (result.code !== 0) {
    console.log("Integration test failed with stderr:", result.stderr);
    console.log("stdout:", result.stdout);
  }
  expect(result.code).toBe(0);
  expect(result.stdout?.trim()).toBeTruthy();
  expect(result.stdout).toContain("feat");
  expect(result.stderr).toBe("");
  console.log(result.stdout);
}, { timeout: 20000 });
