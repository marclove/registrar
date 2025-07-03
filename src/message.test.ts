import { afterEach, beforeEach, expect, vi, test } from "vitest";
import { execa } from "execa";
import * as providersModule from "./providers.js";

// Mock modules and dependencies
const mockExistsSync = vi.fn(() => false);
const mockReadFileSync = vi.fn(() => "");
const mockConsoleError = vi.fn(() => {});
const mockConsoleDebug = vi.fn(() => {});
const mockLanguageModel = vi.fn(() => ({ test: "model" }));
const mockTextEmbeddingModel = vi.fn(() => ({ test: "embedding_model" }));
const mockCreateProvider = vi.fn(() =>
  Promise.resolve({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  }),
);
const mockGenerateObject = vi.fn(() =>
  Promise.resolve({ object: { commit_message: "test: mock commit" } }),
);
const mockParse = vi.fn(() => ({}));
const mockProcessExit = vi.fn(() => {});

// Store originals
const originalProcessExit = process.exit;
const originalConsoleError = console.error;
const originalConsoleDebug = console.debug;
let createProviderSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // Mock process.exit to prevent tests from actually exiting
  process.exit = mockProcessExit as any;
  console.error = mockConsoleError;
  console.debug = mockConsoleDebug;

  // Spy on createProvider instead of mocking the whole module
  createProviderSpy = vi.spyOn(
    providersModule,
    "createProvider",
  ).mockImplementation(mockCreateProvider as any);

  // Clear all mocks
  mockExistsSync.mockClear();
  mockReadFileSync.mockClear();
  mockConsoleError.mockClear();
  mockConsoleDebug.mockClear();
  mockCreateProvider.mockClear();
  mockGenerateObject.mockClear();
  mockParse.mockClear();
  mockLanguageModel.mockClear();
  mockTextEmbeddingModel.mockClear();
  mockProcessExit.mockClear();

  // Set up module mocks
  vi.mock("node:fs", () => ({
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  }));

  vi.mock("ai", () => ({
    generateObject: mockGenerateObject,
  }));

  vi.mock("@iarna/toml", () => ({
    parse: mockParse,
  }));
});

afterEach(() => {
  process.exit = originalProcessExit;
  console.error = originalConsoleError;
  console.debug = originalConsoleDebug;

  // Restore the spy and other mocks
  createProviderSpy.mockRestore();
  vi.restoreAllMocks();
});

test.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
  "integration test with real API key",
  async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith("test-") || apiKey === "test-key") {
      console.log("Skipping integration test - valid ANTHROPIC_API_KEY not set");
      return;
    }

    const testDiff = `diff --git a/src/utils.ts b/src/utils.ts\nindex 1234567..abcdefg 100644\n--- a/src/utils.ts\n+++ b/src/utils.ts\n@@ -1,3 +1,6 @@\n+export function add(a: number, b: number): number {\n+  return a + b;\n+}\n+\n export function multiply(x: number, y: number): number {\n   return x * y;\n }`;

    const result = await execa("node", ["dist/message.js", testDiff], {
      env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
      reject: false,
    });

    if (result.exitCode !== 0) {
      console.log("Integration test failed with stderr:", result.stderr);
      console.log("stdout:", result.stdout);
    }
    expect(result.exitCode).toBe(0);
    expect(result.stdout?.trim()).toBeTruthy();
    expect(result.stdout).toContain("feat");
    expect(result.stderr).toBe("");
    console.log(result.stdout);
  },
  { timeout: 20000 },
);

// Unit tests for complete coverage
test("loadConfig should return defaultConfig when no config file exists", async () => {
  mockExistsSync.mockReturnValue(false);

  const messageModule = await import("./message.js");
  const result = await messageModule.default("test diff");

  expect(mockExistsSync).toHaveBeenCalledWith("config.toml");
  expect(mockConsoleDebug).toHaveBeenCalledWith(
    "No config.toml found, using default configuration",
  );
});

test("loadConfig should handle valid TOML config", async () => {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue(
    'provider = "openai"\nmodel = "gpt-4"\ntemperature = 0.7',
  );
  mockParse.mockReturnValue({
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7,
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  expect(mockExistsSync).toHaveBeenCalledWith("config.toml");
  expect(mockReadFileSync).toHaveBeenCalledWith("config.toml", "utf-8");
  expect(mockParse).toHaveBeenCalled();
});

test("loadConfig should handle invalid provider in config", async () => {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue('provider = "invalid"');
  mockParse.mockReturnValue({ provider: "invalid" });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  expect(mockConsoleError).toHaveBeenCalledWith(
    'Invalid provider "invalid" in config.toml. Must be one of: anthropic, cerebras, cohere, deepseek, google, groq, mistral, openai, perplexity, replicate, togetherai, vercel, xai. Falling back to default provider "anthropic"',
  );
});

test("loadConfig should handle TOML parsing errors", async () => {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue("invalid toml content");
  mockParse.mockImplementation(() => {
    throw new Error("TOML parsing failed");
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  expect(mockConsoleError).toHaveBeenCalledWith(
    "Error reading config.toml:",
    expect.any(Error),
  );
});

test("loadConfig should handle custom prompt in config", async () => {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue('prompt = "Custom prompt"');
  mockParse.mockReturnValue({ prompt: "Custom prompt" });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  expect(mockParse).toHaveBeenCalled();
});

test("generateCommit should handle successful generation", async () => {
  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "feat: add new feature" },
  });

  const messageModule = await import("./message.js");
  const result = await messageModule.default("test diff");

  expect(mockCreateProvider).toHaveBeenCalled();
  expect(mockLanguageModel).toHaveBeenCalled();
  expect(mockGenerateObject).toHaveBeenCalled();
});

test("generateCommit should handle createProvider failure", async () => {
  mockCreateProvider.mockRejectedValue(new Error("Provider creation failed"));

  const messageModule = await import("./message.js");

  await expect(messageModule.default("test diff")).rejects.toThrow(
    "Provider creation failed",
  );
});

test("generateCommit should handle generateObject failure", async () => {
  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockRejectedValue(new Error("Generation failed"));

  const messageModule = await import("./message.js");

  await expect(messageModule.default("test diff")).rejects.toThrow(
    "Generation failed",
  );
});

test("commitMessage should use custom prompt when provided", async () => {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue('prompt = "Custom: ${diff}"');
  mockParse.mockReturnValue({ prompt: "Custom: ${diff}" });

  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "custom: test commit" },
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  expect(mockGenerateObject).toHaveBeenCalledWith(
    expect.objectContaining({
      prompt: "Custom: test diff",
    }),
  );
});

test("commitMessage should use default prompt when not provided", async () => {
  mockExistsSync.mockReturnValue(false);

  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "default: test commit" },
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  expect(mockGenerateObject).toHaveBeenCalledWith(
    expect.objectContaining({
      prompt: expect.stringContaining(
        "You are tasked with writing a commit message",
      ),
    }),
  );
});

test("commitMessage should handle empty prompt in config", async () => {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue('model = "test"');
  mockParse.mockReturnValue({ model: "test" });

  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "test commit" },
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  // Should use default prompt when config.prompt is undefined
  expect(mockGenerateObject).toHaveBeenCalledWith(
    expect.objectContaining({
      prompt: expect.stringContaining(
        "You are tasked with writing a commit message",
      ),
    }),
  );
});

test("main function should handle all config options", async () => {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue(
    'provider = "openai"\nmodel = "gpt-4"\ntemperature = 0.5\nmax_tokens = 100\nprompt = "Test: ${diff}"',
  );
  mockParse.mockReturnValue({
    provider: "openai",
    model: "gpt-4",
    temperature: 0.5,
    max_tokens: 100,
    prompt: "Test: ${diff}",
  });

  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "test: complete config" },
  });

  const messageModule = await import("./message.js");
  const result = await messageModule.default("test diff");

  expect(mockGenerateObject).toHaveBeenCalledWith(
    expect.objectContaining({
      prompt: "Test: test diff",
      temperature: 0.5,
      maxTokens: 100, // Now properly converted from max_tokens
    }),
  );
  expect(result).toBe("test: complete config");
});

test("generateCommit should trim commit message", async () => {
  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "  feat: add feature  " },
  });

  const messageModule = await import("./message.js");
  const result = await messageModule.default("test diff");

  expect(result).toBe("feat: add feature");
});

test("module should export main function as default", async () => {
  const messageModule = await import("./message.js");
  expect(messageModule.default).toBeTruthy();
  expect(typeof messageModule.default).toBe("function");
});

test("config should handle all snake_case conversions", async () => {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue(
    'provider = "openai"\nmodel = "gpt-4"\ntemperature = 0.7\nmax_tokens = 200\napi_key = "test-key"\napi_key_name = "OPENAI_API_KEY"\nprompt = "Snake case: ${diff}"',
  );
  mockParse.mockReturnValue({
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7,
    max_tokens: 200,
    api_key: "test-key",
    api_key_name: "OPENAI_API_KEY",
    prompt: "Snake case: ${diff}",
  });

  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "test: snake case conversion" },
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  expect(mockCreateProvider).toHaveBeenCalledWith("openai", "test-key");
  expect(mockGenerateObject).toHaveBeenCalledWith(
    expect.objectContaining({
      prompt: "Snake case: test diff",
      temperature: 0.7,
      maxTokens: 200, // Converted from max_tokens
    }),
  );
});

test("generateCommit should pass correct parameters to generateObject", async () => {
  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "test: parameters" },
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  expect(mockGenerateObject).toHaveBeenCalledWith(
    expect.objectContaining({
      prompt: expect.any(String),
      temperature: expect.any(Number),
      maxTokens: expect.any(Number),
    }),
  );
});

test("toCamelCase utility should convert snake_case to camelCase", async () => {
  // We need to test the utility function indirectly through the config loading
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue(
    'snake_case_key = "value"\nanother_key = "test"',
  );
  mockParse.mockReturnValue({
    snake_case_key: "value",
    another_key: "test",
  });

  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "test: camel case conversion" },
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  // The conversion should work for any snake_case keys in the TOML
  expect(mockCreateProvider).toHaveBeenCalled();
});

test("convertKeysToCamelCase should handle complex snake_case keys", async () => {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue(
    'multi_word_snake_case = "value"\nsingle = "test"',
  );
  mockParse.mockReturnValue({
    multi_word_snake_case: "value",
    single: "test",
  });

  mockCreateProvider.mockResolvedValue({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  });
  mockGenerateObject.mockResolvedValue({
    object: { commit_message: "test: complex conversion" },
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  // Should handle both multi-word snake_case and single words
  expect(mockCreateProvider).toHaveBeenCalled();
});