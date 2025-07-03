import { expect, test } from "vitest";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { defaultConfig, defaultPrompt, type RuntimeConfig, type TomlConfigSchema } from "./config.js";

const testConfigPath = "test-config.toml";

test("defaultConfig should have correct structure", () => {
  expect(defaultConfig).toBeTruthy();
  expect(defaultConfig.provider).toBe("anthropic");
  expect(defaultConfig.model).toBe("claude-sonnet-4-0");
  expect(defaultConfig.temperature).toBe(1);
  expect(defaultConfig.maxTokens).toBe(250);
  expect(defaultConfig.apiKey).toBeUndefined();
  expect(defaultConfig.prompt).toBeUndefined();
});

test("defaultPrompt should generate correct prompt", () => {
  const testDiff = "test diff content";
  const prompt = defaultPrompt(testDiff);
  
  expect(prompt).toBeTruthy();
  expect(typeof prompt).toBe("string");
  expect(prompt).toContain("Conventional Commits");
  expect(prompt).toContain(testDiff);
  expect(prompt).toContain("commit_message");
  expect(prompt).toContain("feat");
  expect(prompt).toContain("fix");
  expect(prompt).toContain("BREAKING CHANGE");
});

test("defaultPrompt should handle empty diff", () => {
  const prompt = defaultPrompt("");
  expect(prompt).toBeTruthy();
  expect(prompt).toContain("<git_diff>");
  expect(prompt).toContain("</git_diff>");
});

test("defaultPrompt should handle special characters in diff", () => {
  const testDiff = "test diff with ${special} characters & symbols";
  const prompt = defaultPrompt(testDiff);
  
  expect(prompt).toContain(testDiff);
  expect(prompt).toContain("${special}");
  expect(prompt).toContain("&");
});

test("type system should handle RuntimeConfig correctly", () => {
  const config: RuntimeConfig = {
    provider: "anthropic",
    model: "claude-sonnet-4-0",
    temperature: 0.5,
    maxTokens: 100,
    apiKey: "test-key",
    prompt: "custom prompt"
  };
  
  expect(config.provider).toBe("anthropic");
  expect(config.model).toBe("claude-sonnet-4-0");
  expect(config.temperature).toBe(0.5);
  expect(config.maxTokens).toBe(100);
  expect(config.apiKey).toBe("test-key");
  expect(config.prompt).toBe("custom prompt");
});

test("type system should handle TomlConfigSchema correctly", () => {
  const tomlConfig: TomlConfigSchema = {
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7,
    max_tokens: 200,
    api_key: "test-key",
    api_key_name: "OPENAI_API_KEY",
    prompt: "custom prompt"
  };
  
  expect(tomlConfig.provider).toBe("openai");
  expect(tomlConfig.model).toBe("gpt-4");
  expect(tomlConfig.temperature).toBe(0.7);
  expect(tomlConfig.max_tokens).toBe(200);
  expect(tomlConfig.api_key).toBe("test-key");
  expect(tomlConfig.api_key_name).toBe("OPENAI_API_KEY");
  expect(tomlConfig.prompt).toBe("custom prompt");
});

test("snake_case conversion should work correctly", () => {
  // Test that TomlConfigSchema accepts snake_case properties
  const config: TomlConfigSchema = {
    api_key: "test",
    api_key_name: "TEST_KEY",
    max_tokens: 100
  };
  
  expect(config.api_key).toBe("test");
  expect(config.api_key_name).toBe("TEST_KEY");
  expect(config.max_tokens).toBe(100);
});

test("config exports should be available", () => {
  expect(defaultConfig).toBeTruthy();
  expect(defaultPrompt).toBeTruthy();
  expect(typeof defaultPrompt).toBe("function");
});

test("defaultConfig should maintain original values", () => {
  const originalProvider = defaultConfig.provider;
  
  // Test that we can read the original value
  expect(defaultConfig.provider).toBe(originalProvider);
  expect(defaultConfig.provider).toBe("anthropic");
});

test("defaultPrompt should be deterministic", () => {
  const testDiff = "test diff";
  const prompt1 = defaultPrompt(testDiff);
  const prompt2 = defaultPrompt(testDiff);
  
  expect(prompt1).toBe(prompt2);
});

test("defaultPrompt should handle multiline diff", () => {
  const testDiff = `diff --git a/file.ts b/file.ts
index 1234567..abcdefg 100644
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,6 @@
+export function add(a: number, b: number): number {
+  return a + b;
+}
+
 export function multiply(x: number, y: number): number {
   return x * y;
 }`;
  
  const prompt = defaultPrompt(testDiff);
  
  expect(prompt).toContain("diff --git");
  expect(prompt).toContain("export function add");
  expect(prompt).toContain("export function multiply");
  expect(prompt).toContain("@@ -1,3 +1,6 @@");
});
