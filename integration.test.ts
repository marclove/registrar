import { expect, test, beforeEach, afterEach } from "bun:test";
import { spawn } from "node:child_process";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";

interface TestResult {
  code: number;
  stdout?: string;
  stderr: string;
}

const testConfigFile = 'test-config.toml';

beforeEach(() => {
  // Clean up any existing test config
  if (existsSync(testConfigFile)) {
    unlinkSync(testConfigFile);
  }
});

afterEach(() => {
  // Clean up test config
  if (existsSync(testConfigFile)) {
    unlinkSync(testConfigFile);
  }
});

test("built index.js should require staged changes", async () => {
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

  // Store current staged changes
  const stagedFiles = await new Promise<string>((resolve) => {
    const child = spawn("git", ["diff", "--cached", "--name-only"], { stdio: "pipe" });
    let stdout = "";
    
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    child.on("close", () => {
      resolve(stdout.trim());
    });
  });

  // Temporarily unstage all changes
  if (stagedFiles) {
    await new Promise<void>((resolve) => {
      const child = spawn("git", ["reset", "HEAD"], { stdio: "pipe" });
      child.on("close", () => resolve());
    });
  }

  // Test the built index.js script with no staged changes
  const result = await new Promise<TestResult>((resolve) => {
    const child = spawn("node", ["dist/index.js"], { 
      stdio: "pipe",
      env: { ...process.env, ANTHROPIC_API_KEY: "test-key" }
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

  // Restore staged changes
  if (stagedFiles) {
    const filesToRestage = stagedFiles.split('\n').filter(f => f.trim());
    if (filesToRestage.length > 0) {
      await new Promise<void>((resolve) => {
        const child = spawn("git", ["add", ...filesToRestage], { stdio: "pipe" });
        child.on("close", () => resolve());
      });
    }
  }

  // Should exit with code 1 due to no staged changes
  expect(result.code).toBe(1);
  
  // Should show the React-based error message
  expect(result.stdout).toContain("You must stage changes before generating a commit message");
});

test("should use custom config when provided", async () => {
  // Create a test config file
  const testConfig = `
provider = "anthropic"
model = "claude-sonnet-4-20250514"
max_tokens = 100
temperature = 0.5
api_key_name = "ANTHROPIC_API_KEY"
prompt = "Test prompt: \${diff}"
`;
  
  writeFileSync(testConfigFile, testConfig);

  const result = await new Promise<TestResult>((resolve) => {
    const child = spawn("bun", ["message.ts", "test diff content"], {
      stdio: "pipe",
      env: { ...process.env, ANTHROPIC_API_KEY: "test-key" },
      cwd: process.cwd()
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

  // Should attempt to use the config (will fail due to invalid API key, but config should be loaded)
  expect(result.stderr).not.toContain("You must provide a diff as a command-line argument");
});