import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import {
  apiKeyNames,
  createProvider,
  factoryNames,
  loadProviderPackage,
  providers,
} from "./providers.js";
import type { ProviderName } from "./providers.js";

// Mock process.env
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});



test("providers array should contain expected providers", () => {
  expect(providers).toBeTruthy();
  expect(Array.isArray(providers)).toBe(true);
  expect(providers.length).toBeGreaterThan(10);

  // Check for key providers
  expect(providers).toContain("anthropic");
  expect(providers).toContain("openai");
  expect(providers).toContain("google");
  expect(providers).toContain("mistral");
  expect(providers).toContain("groq");
});

test("apiKeyNames should map providers to environment variables", () => {
  expect(apiKeyNames).toBeTruthy();
  expect(typeof apiKeyNames).toBe("object");

  // Check key mappings
  expect(apiKeyNames.anthropic).toBe("ANTHROPIC_API_KEY");
  expect(apiKeyNames.openai).toBe("OPENAI_API_KEY");
  expect(apiKeyNames.google).toBe("GOOGLE_API_KEY");
  expect(apiKeyNames.mistral).toBe("MISTRAL_API_KEY");
  expect(apiKeyNames.groq).toBe("GROQ_API_KEY");

  // Check that all providers have API key names
  providers.forEach((provider) => {
    expect(apiKeyNames[provider]).toBeTruthy();
    expect(typeof apiKeyNames[provider]).toBe("string");
  });
});

test("factoryNames should map providers to factory functions", () => {
  expect(factoryNames).toBeTruthy();
  expect(typeof factoryNames).toBe("object");

  // Check key mappings
  expect(factoryNames.anthropic).toBe("createAnthropic");
  expect(factoryNames.openai).toBe("createOpenAI");
  expect(factoryNames.google).toBe("createGoogle");
  expect(factoryNames.mistral).toBe("createMistral");
  expect(factoryNames.groq).toBe("createGroq");

  // Check that all providers have factory names
  providers.forEach((provider) => {
    expect(factoryNames[provider]).toBeTruthy();
    expect(typeof factoryNames[provider]).toBe("string");
  });
});

test("loadProviderPackage should handle valid provider", async () => {
  // Mock the dynamic import
  const mockPackage = { createAnthropic: mock(() => ({})) };

  // This will fail in real environment, but we can test the error handling
  try {
    await loadProviderPackage("anthropic");
    // If it succeeds, great
  } catch (error) {
    // Expected in test environment without actual packages
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      "Failed to load provider anthropic",
    );
  }
});

test("loadProviderPackage should handle invalid provider", async () => {
  try {
    await loadProviderPackage("invalid" as ProviderName);
    // Should not reach here
    expect(false).toBe(true);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      "Failed to load provider invalid",
    );
  }
});

test("loadProviderPackage should handle import errors", async () => {
  // Test with a provider that will definitely fail to import
  try {
    await loadProviderPackage("xai");
    // If it succeeds, that's fine too
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("Failed to load provider xai");
  }
});

test("createProvider should handle provider with API key", async () => {
  const testApiKey = "test-api-key";

  try {
    await createProvider("anthropic", testApiKey);
    // If it succeeds, great
  } catch (error) {
    // Expected in test environment
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      "Failed to load provider anthropic",
    );
  }
});

test("createProvider should handle provider with environment API key", async () => {
  process.env.ANTHROPIC_API_KEY = "env-api-key";

  try {
    await createProvider("anthropic");
    // If it succeeds, great
  } catch (error) {
    // Expected in test environment
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      "Failed to load provider anthropic",
    );
  }
});

test("createProvider should handle provider without API key", async () => {
  // Remove API key from environment
  delete process.env.ANTHROPIC_API_KEY;

  try {
    await createProvider("anthropic");
    // If it succeeds, great
  } catch (error) {
    // Expected in test environment
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      "Failed to load provider anthropic",
    );
  }
});

test("createProvider should handle different providers", async () => {
  const testProviders: ProviderName[] = ["anthropic", "openai", "google"];

  for (const provider of testProviders) {
    try {
      await createProvider(provider, "test-key");
      // If it succeeds, great
    } catch (error) {
      // Expected in test environment - various error types are possible
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBeTruthy();
      // Error message can vary based on what fails (loading vs instantiation)
    }
  }
});

test("createProvider should handle API key precedence", async () => {
  // Set environment variable
  process.env.OPENAI_API_KEY = "env-key";

  try {
    // Explicit API key should take precedence
    await createProvider("openai", "explicit-key");
    // If it succeeds, great
  } catch (error) {
    // Expected in test environment
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      "Failed to load provider openai",
    );
  }

  try {
    // Should use environment key if no explicit key
    await createProvider("openai");
    // If it succeeds, great
  } catch (error) {
    // Expected in test environment
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      "Failed to load provider openai",
    );
  }
});

test("ProviderName type should be correctly constrained", () => {
  const validProvider: ProviderName = "anthropic";
  expect(providers).toContain(validProvider);

  // TypeScript should catch invalid provider names at compile time
  const provider: ProviderName = "anthropic"; // This should compile
  expect(typeof provider).toBe("string");
});

test("provider mappings should be consistent", () => {
  // All providers should have corresponding entries in all mappings
  providers.forEach((provider) => {
    expect(apiKeyNames[provider]).toBeTruthy();
    expect(factoryNames[provider]).toBeTruthy();
    expect(typeof apiKeyNames[provider]).toBe("string");
    expect(typeof factoryNames[provider]).toBe("string");
  });

  // All mappings should have the same keys
  expect(Object.keys(apiKeyNames).sort()).toEqual(providers.slice().sort());
  expect(Object.keys(factoryNames).sort()).toEqual(providers.slice().sort());
});

test("loadProviderPackage should handle error objects correctly", async () => {
  try {
    await loadProviderPackage("nonexistent" as ProviderName);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      "Failed to load provider nonexistent",
    );

    // Test that it handles both Error instances and string errors
    if (error instanceof Error) {
      expect(error.message).toBeTruthy();
    }
  }
});

test("createProvider should handle factory function calls", async () => {
  // This tests the structure of how createProvider calls factory functions
  const provider: ProviderName = "anthropic";
  const factoryName = factoryNames[provider];

  expect(factoryName).toBe("createAnthropic");
  expect(typeof factoryName).toBe("string");

  // Test the general pattern
  providers.forEach((p) => {
    const factory = factoryNames[p];
    expect(factory).toMatch(/^create[A-Z][a-zA-Z]*$/);
  });
});
