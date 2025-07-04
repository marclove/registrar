import { execa } from "execa";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { afterAll, beforeAll, expect, test } from "vitest";

const tmpDir = join(__dirname, "tmp", "init-test");
const distDir = resolve(__dirname, "..", "dist");
const defaultTomlPath = resolve(__dirname, "..", "public", "default.toml");

beforeAll(async () => {
  await execa("npm", ["run", "build"]);
  mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

test("init command should create llmc.toml", async () => {
  const { stdout, exitCode } = await execa("node", [join(distDir, "index.js"), "init"], { cwd: tmpDir });

  expect(exitCode).toBe(0);
  expect(stdout).toContain("llmc.toml created successfully.");

  const llmcTomlPath = join(tmpDir, "llmc.toml");
  expect(existsSync(llmcTomlPath)).toBe(true);

  const llmcTomlContent = readFileSync(llmcTomlPath, "utf-8");
  const defaultTomlContent = readFileSync(defaultTomlPath, "utf-8");
  expect(llmcTomlContent).toBe(defaultTomlContent);
});

test("init command should not overwrite existing llmc.toml", async () => {
  // Create a dummy llmc.toml file
  const llmcTomlPath = join(tmpDir, "llmc.toml");
  const dummyContent = "dummy content";
  writeFileSync(llmcTomlPath, dummyContent);

  const { stderr, exitCode } = await execa("node", [join(distDir, "index.js"), "init"], { cwd: tmpDir, reject: false });

  expect(exitCode).toBe(1);
  expect(stderr).toContain("llmc.toml already exists in the current directory.");

  const llmcTomlContent = readFileSync(llmcTomlPath, "utf-8");
  expect(llmcTomlContent).toBe(dummyContent);
});
