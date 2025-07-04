import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import fs from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "./message.js";

vi.mock("node:fs", async () => {
  const actualFs = await vi.importActual<typeof fs>("node:fs");
  return {
    ...actualFs,
    readFileSync: vi.fn((path: string, encoding?: string) => {
      if (path.endsWith("default.toml")) {
        return `
          provider = "anthropic"
          model = "claude-3-haiku-20240307"
          temperature = 0.7
          max_tokens = 2048
          prompt = """You are tasked with writing a commit message that conforms to the Conventional Commits specification."""
        `;
      }
      if (path.endsWith("llmc.toml")) {
        if (actualFs.existsSync(path)) {
          return actualFs.readFileSync(path, encoding as any);
        }
        return "";
      }
      return actualFs.readFileSync(path, encoding as any);
    }),
  };
});

describe("config loading", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(__dirname, "temp-test-dir");
    mkdirSync(tempDir, { recursive: true });
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir("..");
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("should load default config when no llmc.toml exists", async () => {
    const config = await loadConfig();
    expect(config.provider).toBe("anthropic");
    expect(config.model).toBe("claude-3-haiku-20240307");
    expect(config.temperature).toBe(0.7);
    expect(config.maxTokens).toBe(2048);
    expect(config.prompt).toContain("Conventional Commits");
  });

  it("should load and merge llmc.toml", async () => {
    const llmcConfig = {
      provider: "openai",
      model: "gpt-4",
      temperature: 0.5,
    };
    writeFileSync(
      "llmc.toml",
      `provider = "${llmcConfig.provider}"
model = "${llmcConfig.model}"
temperature = ${llmcConfig.temperature}
`,
    );

    const config = await loadConfig();
    expect(config.provider).toBe(llmcConfig.provider);
    expect(config.model).toBe(llmcConfig.model);
    expect(config.temperature).toBe(llmcConfig.temperature);
    expect(config.maxTokens).toBe(2048);
    expect(config.prompt).toContain("Conventional Commits");
  });
});
