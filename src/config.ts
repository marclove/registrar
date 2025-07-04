import type { ProviderName } from "./providers.js";

export interface RuntimeConfig {
  apiKey?: string;
  apiKeyName?: string;
  provider: ProviderName;
  model: string;
  temperature: number;
  maxTokens: number;
  prompt?: string;
}

/**
 * User-provided configuration input (all optional except API credentials)
 */
type UserConfigInput =
  & Partial<
    Pick<
      RuntimeConfig,
      "provider" | "model" | "temperature" | "maxTokens" | "prompt"
    >
  >
  & Pick<RuntimeConfig, "apiKey" | "apiKeyName">;

// Convert camelCase to snake_case using template literals
type ToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? T extends Uppercase<T> ? `_${Lowercase<T>}${ToSnakeCase<U>}`
  : `${T}${ToSnakeCase<U>}`
  : S;

type SnakeCaseKeys<T> = {
  [K in keyof T as ToSnakeCase<K & string>]: T[K];
};

/**
 * TOML file structure with snake_case property names
 */
export type TomlConfigSchema = SnakeCaseKeys<UserConfigInput>;
