import { execa } from "execa";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as providersModule from "./providers.js";

// Mock functions
const mockGenerateObject = vi.fn(() => Promise.resolve({ object: { commit_message: "test: mock commit" } }));
const mockConsoleError = vi.fn(() => {});
const mockConsoleDebug = vi.fn(() => {});
const mockLanguageModel = vi.fn(() => ({ test: "model" }));
const mockTextEmbeddingModel = vi.fn(() => ({ test: "embedding_model" }));
const mockCreateProvider = vi.fn(() =>
  Promise.resolve({
    languageModel: mockLanguageModel,
    textEmbeddingModel: mockTextEmbeddingModel,
  })
);
const mockProcessExit = vi.fn(() => {});

// Store originals
const originalProcessExit = process.exit;
const originalConsoleError = console.error;
const originalConsoleDebug = console.debug;
let createProviderSpy: any;

const MOCK_DEFAULT_TOML = `
provider = "anthropic"
model = "claude-3-haiku-20240307"
temperature = 0.7
max_tokens = 2048
prompt = """You are tasked with writing a commit message that conforms to the Conventional Commits specification.
The user will provide you with a git diff of the changes.
You should respond with a detailed commit message that accurately describes the changes.
The commit message should be in the following format:
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
"""
`;

vi.doMock("node:fs", () => ({
  existsSync: vi.fn((path: string) => {
    if (path.endsWith("llmc.toml")) {
      return false;
    }
    return true;
  }),
  readFileSync: vi.fn((path: string, encoding?: string) => {
    if (path.endsWith("default.toml")) {
      return MOCK_DEFAULT_TOML;
    }
    if (path.endsWith("llmc.toml")) {
      return "";
    }
    return "";
  }),
}));

vi.doMock("@iarna/toml", () => ({
  parse: vi.fn((content: string) => {
    const toml = require("@iarna/toml");
    return toml.parse(content);
  }),
}));

vi.doMock("ai", () => ({
  generateObject: mockGenerateObject,
}));

beforeEach(async () => {
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
  mockGenerateObject.mockClear();
  mockConsoleError.mockClear();
  mockConsoleDebug.mockClear();
  mockCreateProvider.mockClear();
  mockLanguageModel.mockClear();
  mockTextEmbeddingModel.mockClear();
  mockProcessExit.mockClear();
  vi.clearAllMocks();

  // Reset to default behavior
  mockGenerateObject.mockResolvedValue({ object: { commit_message: "test: mock commit" } });
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

    const testDiff =
      `diff --git a/src/utils.ts b/src/utils.ts\nindex 1234567..abcdefg 100644\n--- a/src/utils.ts\n+++ b/src/utils.ts\n@@ -1,3 +1,6 @@\n+export function add(a: number, b: number): number {\n+  return a + b;\n+}\n+\n export function multiply(x: number, y: number): number {\n   return x * y;\n }`;

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

test("generateCommit should handle successful generation", async () => {
  const messageModule = await import("./message.js");
  const result = await messageModule.default("test diff");

  expect(mockCreateProvider).toHaveBeenCalled();
  expect(mockLanguageModel).toHaveBeenCalled();
  expect(mockGenerateObject).toHaveBeenCalled();
  expect(result).toBe("test: mock commit");
});

test("generateCommit should handle createProvider failure", async () => {
  mockCreateProvider.mockRejectedValue(new Error("Provider creation failed"));

  const messageModule = await import("./message.js");

  await expect(messageModule.default("test diff")).rejects.toThrow(
    "Provider creation failed",
  );
});

test("generateCommit should handle generateObject failure", async () => {
  mockGenerateObject.mockRejectedValue(new Error("Generation failed"));

  const messageModule = await import("./message.js");

  await expect(messageModule.default("test diff")).rejects.toThrow(
    "Generation failed",
  );
});

test("commitMessage should use custom prompt when provided", async () => {
  const { existsSync, readFileSync } = await import("node:fs");
  vi.mocked(existsSync).mockReturnValue(true);
  vi.mocked(readFileSync).mockImplementation((path: string) => {
    if (path.endsWith("default.toml")) {
      return MOCK_DEFAULT_TOML;
    }
    if (path.endsWith("llmc.toml")) {
      return "prompt = \"Custom: ${diff}\"";
    }
    return "";
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
  const { existsSync, readFileSync } = await import("node:fs");
  vi.mocked(existsSync).mockReturnValue(true);
  vi.mocked(readFileSync).mockImplementation((path: string) => {
    if (path.endsWith("default.toml")) {
      return MOCK_DEFAULT_TOML;
    }
    if (path.endsWith("llmc.toml")) {
      return "model = \"test\"";
    }
    return "";
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

test("main function should handle all config options", async () => {
  const { existsSync, readFileSync } = await import("node:fs");
  vi.mocked(existsSync).mockReturnValue(true);
  vi.mocked(readFileSync).mockImplementation((path: string) => {
    if (path.endsWith("default.toml")) {
      return MOCK_DEFAULT_TOML;
    }
    if (path.endsWith("llmc.toml")) {
      return "provider = \"openai\"\nmodel = \"gpt-4\"\ntemperature = 0.5\nmax_tokens = 100\nprompt = \"Test: ${diff}\"";
    }
    return "";
  });

  const messageModule = await import("./message.js");
  const result = await messageModule.default("test diff");

  expect(mockGenerateObject).toHaveBeenCalledWith(
    expect.objectContaining({
      prompt: "Test: test diff",
      temperature: 0.5,
      maxTokens: 100,
    }),
  );
  expect(result).toBe("test: mock commit");
});

test("generateCommit should trim commit message", async () => {
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
  const { existsSync, readFileSync } = await import("node:fs");
  vi.mocked(existsSync).mockReturnValue(true);
  vi.mocked(readFileSync).mockImplementation((path: string) => {
    if (path.endsWith("default.toml")) {
      return MOCK_DEFAULT_TOML;
    }
    if (path.endsWith("llmc.toml")) {
      return "provider = \"openai\"\nmodel = \"gpt-4\"\ntemperature = 0.7\nmax_tokens = 200\napi_key = \"test-key\"\napi_key_name = \"OPENAI_API_KEY\"\nprompt = \"Snake case: ${diff}\"";
    }
    return "";
  });

  const messageModule = await import("./message.js");
  await messageModule.default("test diff");

  expect(mockCreateProvider).toHaveBeenCalledWith("openai", "test-key");
  expect(mockGenerateObject).toHaveBeenCalledWith(
    expect.objectContaining({
      prompt: "Snake case: test diff",
      temperature: 0.7,
      maxTokens: 200,
    }),
  );
});

test("generateCommit should pass correct parameters to generateObject", async () => {
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
  const { existsSync, readFileSync } = await import("node:fs");
  vi.mocked(existsSync).mockReturnValue(true);
  vi.mocked(readFileSync).mockImplementation((path: string) => {
    if (path.endsWith("default.toml")) {
      return MOCK_DEFAULT_TOML;
    }
    if (path.endsWith("llmc.toml")) {
      return "snake_case_key = \"value\"\nanother_key = \"test\"";
    }
    return "";
  });

  const messageModule = await import("./message.js");
  const config = await (messageModule as any).loadConfig();

  expect(config.snakeCaseKey).toBe("value");
  expect(config.anotherKey).toBe("test");
});

test("convertKeysToCamelCase should handle complex snake_case keys", async () => {
  const { existsSync, readFileSync } = await import("node:fs");
  vi.mocked(existsSync).mockReturnValue(true);
  vi.mocked(readFileSync).mockImplementation((path: string) => {
    if (path.endsWith("default.toml")) {
      return MOCK_DEFAULT_TOML;
    }
    if (path.endsWith("llmc.toml")) {
      return "multi_word_snake_case = \"value\"\nsingle = \"test\"";
    }
    return "";
  });

  const messageModule = await import("./message.js");
  const config = await (messageModule as any).loadConfig();

  expect(config.multiWordSnakeCase).toBe("value");
  expect(config.single).toBe("test");
});
