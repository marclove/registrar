# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Registrar is an AI-powered commit message generator that creates Conventional Commits-compliant messages from git diffs. It's a Node.js/TypeScript CLI tool that supports multiple AI providers (Anthropic, OpenAI, Google, etc.) and can be integrated with git hooks.

## Architecture

### Core Components

- **index.ts**: Main CLI entry point that handles git integration and command-line usage
- **message.ts**: Core message generation logic with AI provider integration
- **providers.ts**: Dynamic provider loading system supporting 13+ AI services
- **config.ts**: Configuration management with TOML support and type-safe defaults

### Key Design Patterns

- **Dynamic Provider Loading**: Providers are loaded on-demand to reduce bundle size
- **Configuration Hierarchy**: TOML config file → environment variables → sensible defaults
- **Structured Generation**: Uses `generateObject` with Zod schema for reliable output
- **Template Interpolation**: Custom prompts support `${diff}` placeholders

## Development Commands

```bash
# Build the project
bun run build

# Run tests
bun test

# Build for testing (includes all dependencies)
bun run build:test

# Prepare for publishing
bun run prepublishOnly
```

## Testing

- Uses Bun's built-in test runner
- Integration tests require valid `ANTHROPIC_API_KEY`
- Tests cover CLI argument handling, config loading, and build verification
- Run `bun test` for full test suite

## Configuration

The application uses a `config.toml` file in the project root with these key settings:

- `provider`: AI service to use (defaults to "anthropic")
- `model`: Specific model name
- `max_tokens`: Response length limit
- `temperature`: AI creativity level
- `prompt`: Custom message template with `${diff}` interpolation

## Build Process

The build process uses Bun with extensive externalization of AI SDK packages to keep the bundle size manageable. Both `index.ts` and `message.ts` are built separately with identical external dependencies.

## API Integration

Each provider requires its own API key set as an environment variable (e.g., `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`). The system automatically maps providers to their expected environment variable names.