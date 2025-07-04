import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as app from "./app.js";
import { main } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

vi.mock("./app.js", () => ({
  runApp: vi.fn(() => Promise.resolve()),
  runInit: vi.fn(() => Promise.resolve()),
}));

// Helper function to get package version
function getPackageVersion(): string {
  const packageJsonPath = join(__dirname, "../package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

describe("CLI Arguments with yargs", () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  describe("Message-only flags", () => {
    it("should recognize --no-commit flag", async () => {
      process.argv = ["node", "index.js", "--no-commit"];
      await main();
      expect(app.runApp).toHaveBeenCalledWith({ messageOnly: true });
    });

    it("should recognize --message-only flag", async () => {
      process.argv = ["node", "index.js", "--message-only"];
      await main();
      expect(app.runApp).toHaveBeenCalledWith({ messageOnly: true });
    });
  });
});

describe("Version function", () => {
  it("should return correct version from package.json", () => {
    const version = getPackageVersion();
    expect(version).toContain("0.1");
    expect(typeof version).toBe("string");
    expect(version.length).toBeGreaterThan(0);
  });
});
