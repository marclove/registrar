import type { ProviderV1 } from "@ai-sdk/provider";

export const providers = [
  "anthropic",
  "cerebras",
  "cohere",
  "deepseek",
  "google",
  "groq",
  "mistral",
  "openai",
  "perplexity",
  "replicate",
  "togetherai",
  "vercel",
  "xai",
] as const;

export type ProviderName = typeof providers[number];

const providerPackages: Record<ProviderName, string> = {
  "anthropic": "@ai-sdk/anthropic",
  "cerebras": "@ai-sdk/cerebras",
  "cohere": "@ai-sdk/cohere",
  "deepseek": "@ai-sdk/deepseek",
  "google": "@ai-sdk/google",
  "groq": "@ai-sdk/groq",
  "mistral": "@ai-sdk/mistral",
  "openai": "@ai-sdk/openai",
  "perplexity": "@ai-sdk/perplexity",
  "replicate": "@ai-sdk/replicate",
  "togetherai": "@ai-sdk/togetherai",
  "vercel": "@ai-sdk/vercel",
  "xai": "@ai-sdk/xai",
};

export const apiKeyNames: Record<ProviderName, string> = {
  "anthropic": "ANTHROPIC_API_KEY",
  "cerebras": "CEREBRAS_API_KEY",
  "cohere": "COHERE_API_KEY",
  "deepseek": "DEEPSEEK_API_KEY",
  "google": "GOOGLE_API_KEY",
  "groq": "GROQ_API_KEY",
  "mistral": "MISTRAL_API_KEY",
  "openai": "OPENAI_API_KEY",
  "perplexity": "PERPLEXITY_API_KEY",
  "replicate": "REPLICATE_API_KEY",
  "togetherai": "TOGETHER_AI_API_KEY",
  "vercel": "VERCEL_API_KEY",
  "xai": "XAI_API_KEY",
};

export const factoryNames: Record<ProviderName, string> = {
  "anthropic": "createAnthropic",
  "cerebras": "createCerebras",
  "cohere": "createCohere",
  "deepseek": "createDeepSeek",
  "google": "createGoogle",
  "groq": "createGroq",
  "mistral": "createMistral",
  "openai": "createOpenAI",
  "perplexity": "createPerplexity",
  "replicate": "createReplicate",
  "togetherai": "createTogetherAI",
  "vercel": "createVercel",
  "xai": "createXai",
};

/**
 * Dynamically imports and returns the requested provider library.
 * This ensures that only the needed provider is loaded into memory.
 *
 * @param provider - The name of the provider to load
 * @returns The loaded provider library
 * @throws Error if the provider package cannot be loaded
 */
export async function loadProviderPackage(
  provider: ProviderName,
): Promise<any> {
  try {
    const packageName = providerPackages[provider];
    return await import(packageName);
  } catch (error) {
    throw new Error(
      `Failed to load provider ${provider}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export async function createProvider(
  provider: ProviderName,
  apiKey?: string,
): Promise<ProviderV1> {
  const factoryName = factoryNames[provider];
  const providerPackage = await loadProviderPackage(provider);
  
  const options: any = {};
  if (apiKey) {
    options.apiKey = apiKey;
  } else {
    // Try to get API key from environment
    const envKeyName = apiKeyNames[provider];
    const envApiKey = process.env[envKeyName];
    if (envApiKey) {
      options.apiKey = envApiKey;
    }
  }
  
  return new providerPackage[factoryName](options);
}
