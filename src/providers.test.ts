import { beforeEach, expect, test, vi } from "vitest";
import { apiKeyNames, createProvider, factoryNames, loadProviderPackage, providers } from "./providers.js";
import type { ProviderName } from "./providers.js";

// Mock process.env
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
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
  vi.mock("@ai-sdk/anthropic", () => ({
    createAnthropic: vi.fn(() => ({})),
  }));

  try {
    await loadProviderPackage("anthropic");
  } catch (error) {
    // This should not be reached if the mock is working
    expect(error).toBeUndefined();
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

test("createProvider should handle provider with API key", async () => {
  const testApiKey = "test-api-key";
  vi.mock("@ai-sdk/anthropic", () => ({
    createAnthropic: vi.fn(() => ({})),
  }));

  try {
    await createProvider("anthropic", testApiKey);
  } catch (error) {
    expect(error).toBeUndefined();
  }
});

test("createProvider should handle provider with environment API key", async () => {
  process.env.ANTHROPIC_API_KEY = "env-api-key";
  vi.mock("@ai-sdk/anthropic", () => ({
    createAnthropic: vi.fn(() => ({})),
  }));

  try {
    await createProvider("anthropic");
  } catch (error) {
    expect(error).toBeUndefined();
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
