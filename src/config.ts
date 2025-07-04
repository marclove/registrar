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

export const defaultConfig: RuntimeConfig = {
  provider: "anthropic",
  model: "claude-sonnet-4-0",
  temperature: 1,
  maxTokens: 250,
};

export const defaultPrompt = function(diff: string) {
  return `You are tasked with writing a commit message that follows the Conventional Commits specification based on a given git diff.

Here's a summary of the Conventional Commits specification:

1. The commit message should have this structure:

<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

2. Types include: fix, feat, build, chore, ci, docs, style, refactor, perf, test
3. A scope may be provided after the type, within parentheses
4. The description should be a short summary of the code changes
5. A longer commit body may be provided after the short description
6. Footer(s) may be provided one blank line after the body
7. Breaking changes must be indicated by "!" after the type/scope,
   or "BREAKING CHANGE:" in the footer

Now, analyze the following git diff:

<git_diff>
${diff}
</git_diff>

To write an appropriate commit message:

1. Examine the changes in the git diff carefully
2. Determine the primary purpose of the changes (e.g., bug fix, new feature, refactor)
3. Identify the appropriate type based on the changes
4. If applicable, determine a relevant scope
5. Write a concise description of the changes
6. If necessary, add a more detailed explanation in the commit body
7. Include any relevant footer information, especially for breaking changes

Your task is to write a commit message that follows the Conventional Commits
specification based on the provided git diff. The commit message should
accurately describe the changes while adhering to the specified format.

Provide your commit message within \`commit_message\` key.`;
};
