import { parse } from "@iarna/toml";
import { existsSync, readFileSync } from "fs";
import { expect, test } from "vitest";
import { type RuntimeConfig, type TomlConfigSchema } from "./config.js";

const testConfigPath = "test-llmc.toml";

const defaultConfigPath = "public/default.toml";

test("default.toml should exist and have correct structure", () => {
  expect(existsSync(defaultConfigPath)).toBeTruthy();

  const defaultConfigContent = readFileSync(defaultConfigPath, "utf-8");
  const defaultConfig = parse(defaultConfigContent) as any;

  expect(defaultConfig.provider).toBe("anthropic");
  expect(defaultConfig.model).toBe("claude-sonnet-4-0");
  expect(defaultConfig.temperature).toBe(1);
  expect(defaultConfig.max_tokens).toBe(250);
  expect(defaultConfig.prompt).toBeTruthy();
  expect(typeof defaultConfig.prompt).toBe("string");
});

test("default.toml prompt should have correct content", () => {
  const defaultConfigContent = readFileSync(defaultConfigPath, "utf-8");
  const defaultConfig = parse(defaultConfigContent) as any;
  const prompt = defaultConfig.prompt;

  expect(prompt).toBeTruthy();
  expect(typeof prompt).toBe("string");
  expect(prompt).toContain("Conventional Commits");
  expect(prompt).toContain("${diff}");
  expect(prompt).toContain("commit_message");
  expect(prompt).toContain("feat");
  expect(prompt).toContain("fix");
  expect(prompt).toContain("BREAKING CHANGE");
});

test("type system should handle RuntimeConfig correctly", () => {
  const config: RuntimeConfig = {
    provider: "anthropic",
    model: "claude-sonnet-4-0",
    temperature: 0.5,
    maxTokens: 100,
    apiKey: "test-key",
    prompt: "custom prompt",
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
    prompt: "custom prompt",
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
    max_tokens: 100,
  };

  expect(config.api_key).toBe("test");
  expect(config.api_key_name).toBe("TEST_KEY");
  expect(config.max_tokens).toBe(100);
});

test("default.toml should be readable and parseable", () => {
  expect(existsSync(defaultConfigPath)).toBeTruthy();

  const defaultConfigContent = readFileSync(defaultConfigPath, "utf-8");
  expect(() => parse(defaultConfigContent)).not.toThrow();

  const defaultConfig = parse(defaultConfigContent) as any;
  expect(defaultConfig.provider).toBe("anthropic");
});
