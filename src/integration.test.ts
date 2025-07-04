import { $, execa } from "execa";
import { mkdirSync, rmSync } from "fs";
import { join, resolve } from "path";
import { afterAll, beforeAll, expect, test } from "vitest";

const tmpDir = join(__dirname, "tmp", "integration-test");
const distDir = resolve(__dirname, "..", "dist");

beforeAll(async () => {
  await execa("npm", ["run", "build"]);
  mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

test("built index.js should require staged changes", async () => {
  const gitDir = join(tmpDir, "no-staged-changes");
  mkdirSync(gitDir, { recursive: true });
  await execa("git", ["init"], { cwd: gitDir });
  await execa("git", ["config", "user.email", "test@example.com"], { cwd: gitDir });
  await execa("git", ["config", "user.name", "Test User"], { cwd: gitDir });

  const { all, exitCode } = await $({ cwd: gitDir, reject: false, all: true })`node ${join(distDir, "index.js")}`;

  expect(exitCode).toBe(1);
  expect(all).toContain("You must stage changes before generating a commit message");
});
