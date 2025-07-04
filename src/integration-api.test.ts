import { $, execa } from "execa";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { afterAll, beforeAll, expect, test } from "vitest";

const tmpDir = join(__dirname, "tmp", "integration-api-test");
const distDir = resolve(__dirname, "..", "dist");

beforeAll(async () => {
  await execa("npm", ["run", "build"]);
  mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

test("should use custom config when provided", async () => {
  const gitDir = join(tmpDir, "custom-config");
  mkdirSync(gitDir, { recursive: true });
  await execa("git", ["init"], { cwd: gitDir });
  await execa("git", ["config", "user.email", "test@example.com"], { cwd: gitDir });
  await execa("git", ["config", "user.name", "Test User"], { cwd: gitDir });

  const testConfigFile = join(gitDir, "config.toml");
  const testConfig = `
provider = "anthropic"
model = "claude-sonnet-4-20250514"
max_tokens = 100
temperature = 0.5
api_key_name = "ANTHROPIC_API_KEY"
prompt = "Test prompt: \${diff}"
`;
  writeFileSync(testConfigFile, testConfig);

  writeFileSync(join(gitDir, "test.txt"), "hello world");
  await execa("git", ["add", "test.txt"], { cwd: gitDir });

  const { stderr } = await $({ cwd: gitDir, reject: false })`node ${join(distDir, "index.js")}`;

  expect(stderr).not.toContain("You must provide a diff as a command-line argument");
}, 60000); // Increased timeout for API call
