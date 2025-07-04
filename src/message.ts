import type { LanguageModelV1 } from "@ai-sdk/provider";
import { parse } from "@iarna/toml";
import { generateObject } from "ai";
import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";
import { type RuntimeConfig, type TomlConfigSchema } from "./config.js";
import { createProvider, type ProviderName, providers } from "./providers.js";

const schema = z.object({
  commit_message: z.string().describe("The detailed commit message"),
});

async function generateCommit(
  providerName: ProviderName,
  modelName: string,
  prompt: string,
  temperature: number,
  maxTokens: number,
  apiKey?: string,
): Promise<string> {
  const provider = await createProvider(providerName, apiKey);
  const model: LanguageModelV1 = provider.languageModel(modelName);
  const result = await generateObject({
    model,
    schema,
    prompt,
    temperature,
    maxTokens,
  });
  return result.object.commit_message.trim();
}

const configFileName = "llmc.toml";
const defaultConfigFileName = "default.toml";

/**
 * Convert snake_case string to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert an object with snake_case keys to camelCase keys
 */
function convertKeysToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = value;
  }
  return result;
}

/**
 * Load default configuration from default.toml file
 */
function loadDefaultConfig(): RuntimeConfig {
  try {
    const defaultConfigContent = readFileSync(defaultConfigFileName, "utf-8");
    const defaultTomlConfig = parse(defaultConfigContent) as TomlConfigSchema;
    return convertKeysToCamelCase(defaultTomlConfig) as RuntimeConfig;
  } catch (error) {
    throw new Error(`Failed to load default configuration from ${defaultConfigFileName}: ${error}`);
  }
}

/**
 * Load configuration from llmc.toml file merged with defaults from default.toml
 */
async function loadConfig(): Promise<RuntimeConfig> {
  const defaultConfig = loadDefaultConfig();

  if (!existsSync(configFileName)) {
    return defaultConfig;
  }

  try {
    const configContent = readFileSync(configFileName, "utf-8");
    const tomlConfig = parse(configContent) as TomlConfigSchema;

    if (tomlConfig.provider && !providers.includes(tomlConfig.provider)) {
      console.error(
        `Invalid provider "${tomlConfig.provider}" in ${configFileName}. Must be one of: ${
          providers.join(", ")
        }. Falling back to default provider "${defaultConfig.provider}"`,
      );
      // Remove invalid provider so it doesn't override the default
      delete tomlConfig.provider;
    }

    // Convert snake_case TOML keys to camelCase and merge with defaults
    const camelCaseConfig = convertKeysToCamelCase(tomlConfig);
    const config = {
      ...defaultConfig,
      ...camelCaseConfig,
    };

    return config;
  } catch (error) {
    console.error(`Error reading ${configFileName}:`, error);
    return defaultConfig;
  }
}

async function commitMessage(
  diff: string,
  config: RuntimeConfig,
): Promise<string> {
  // The prompt should always be available from default.toml
  const promptText = config.prompt?.replace(/\$\{diff\}/g, diff) || "";

  return await generateCommit(
    config.provider,
    config.model,
    promptText,
    config.temperature,
    config.maxTokens,
    config.apiKey,
  );
}

async function main(diff: string): Promise<string> {
  const config = await loadConfig();
  return await commitMessage(diff, config);
}

export default main;
