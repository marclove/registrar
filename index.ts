#!/usr/bin/env node

import type { LanguageModelV1 } from "@ai-sdk/provider";
import { parse } from "@iarna/toml";
import { generateObject } from "ai";
import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";
import {
  defaultConfig,
  defaultPrompt,
  type RuntimeConfig,
  type TomlConfigSchema,
} from "./config.js";
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

const configFileName = "config.toml";

/**
 * Load configuration from config.toml file with fallback to defaults
 */
async function loadConfig(): Promise<RuntimeConfig> {
  if (!existsSync(configFileName)) {
    console.debug(`No ${configFileName} found, using default configuration`);
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
    }

    const config = {
      ...defaultConfig,
      ...tomlConfig,
    };

    // Handle snake_case conversion for prompt
    if ("prompt" in tomlConfig) {
      config.prompt = tomlConfig.prompt;
    }

    return config;
  } catch (error) {
    console.error(`Error reading ${configFileName}:`, error);
    return defaultConfig;
  }
}

async function writeCommit(
  diff: string,
  config: RuntimeConfig,
): Promise<string> {
  let promptText: string;

  if (config.prompt) {
    promptText = config.prompt.replace(/\$\{diff\}/g, diff);
  } else {
    promptText = defaultPrompt(diff);
  }
  return await generateCommit(
    config.provider,
    config.model,
    promptText,
    config.temperature,
    config.maxTokens,
    config.apiKey,
  );
}

async function main() {
  const diff = process.argv[2];

  if (!diff) {
    console.error("Please provide a diff as a command-line argument.");
    process.exit(1);
  }

  try {
    const config = await loadConfig();
    const commitMessage = await writeCommit(diff, config);
    console.log(commitMessage);
  } catch (error) {
    console.error("Error generating commit message:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
