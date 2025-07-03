# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Registrar is an AI-powered commit message generator that creates Conventional Commits-compliant messages from git diffs. It's a Node.js/TypeScript CLI tool that supports multiple AI providers (Anthropic, OpenAI, Google, etc.) and can be integrated with git hooks. The tool offers two modes: automatic commit mode (default) and message-only mode for git hook integration.

## Architecture

### Core Components

- **index.ts**: Main CLI entry point and orchestrator with command-line argument parsing for message-only mode
- **app.tsx**: React-based application logic with git integration, CLI rendering, and dual-mode support
- **message.ts**: Core message generation logic with AI provider integration
- **providers.ts**: Dynamic provider loading system supporting 13+ AI services
- **config.ts**: Configuration management with TOML support and type-safe defaults
- **cli.tsx**: React component for CLI interface with ink for progress indicators and status messages

### Key Design Patterns

- **Dynamic Provider Loading**: Providers are loaded on-demand to reduce bundle size
- **Configuration Hierarchy**: TOML config file → environment variables → sensible defaults
- **Structured Generation**: Uses `generateObject` with Zod schema for reliable output
- **Template Interpolation**: Custom prompts support `${diff}` placeholders
- **React-based CLI**: Uses ink for rich terminal UI with spinners and real-time status updates
- **Separation of Concerns**: index.ts remains simple .ts for compatibility, React/JSX logic in .tsx files
- **Snake/Camel Case Conversion**: Automatic conversion between TOML snake_case and TypeScript camelCase
- **Comprehensive Testing**: Full test coverage with unit, integration, and UI testing strategies

## Development Commands

```bash
# Build the project
bun run build

# Run tests
bun test

# Type checking and linting
bun run lint
bun run typecheck

# Build for testing (includes all dependencies)
bun run build:test

# Prepare for publishing
bun run prepublishOnly
```

## Testing

- Uses Bun's built-in test runner with `ink-testing-library` for React component testing
- Integration tests require valid `ANTHROPIC_API_KEY`
- Tests cover CLI argument handling, config loading, build verification, and React UI components
- Comprehensive test coverage achieved: ~90% overall, 100% for core modules
- Timer increment testing limited by Bun's current timer mocking capabilities
- Run `bun test` for full test suite (80+ tests across 8 files)

### Test Files
- `cli.test.tsx`: React component rendering and status transitions
- `app.test.tsx`: Application logic, React UI testing, and module exports
- `index.test.ts`: Entry point module structure
- `integration.test.ts`: Built executable and configuration loading
- `message.test.ts`: Core message generation functionality with 100% coverage
- `config.test.ts`: Configuration management and type system validation
- `providers.test.ts`: Provider loading and factory functions
- `message-only.test.ts`: Message-only mode functionality and argument parsing

### Test Coverage Strategy
- **Unit Tests**: Individual functions and components with comprehensive mocking
- **Integration Tests**: Real CLI execution and git integration
- **UI Tests**: React component behavior using `ink-testing-library`
- **Error Path Testing**: All failure scenarios and edge cases covered
- **Mock Strategy**: Extensive use of Bun's `mock.module()` for dependency isolation

## Configuration

The application uses a `config.toml` file in the project root with these key settings:

- `provider`: AI service to use (defaults to "anthropic")
- `model`: Specific model name
- `max_tokens`: Response length limit (snake_case in TOML)
- `api_key`: Explicit API key (snake_case in TOML)
- `api_key_name`: Environment variable name for API key (snake_case in TOML)
- `temperature`: AI creativity level
- `prompt`: Custom message template with `${diff}` interpolation

### Configuration File Format
The configuration uses **snake_case** naming in TOML files but is automatically converted to **camelCase** in TypeScript runtime:

```toml
# config.toml (snake_case)
provider = "openai"
max_tokens = 200
api_key = "your-key"
api_key_name = "OPENAI_API_KEY"
```

```typescript
// Runtime config (camelCase)
{
  provider: "openai",
  maxTokens: 200,      // Converted from max_tokens
  apiKey: "your-key",  // Converted from api_key
  apiKeyName: "OPENAI_API_KEY"  // Converted from api_key_name
}
```

### Configuration Loading
- **Automatic Conversion**: Built-in `toCamelCase()` utility converts snake_case TOML keys to camelCase TypeScript properties
- **Graceful Fallbacks**: Missing config file or parsing errors fall back to sensible defaults
- **Type Safety**: Full TypeScript type checking with `TomlConfigSchema` and `RuntimeConfig` types
- **Validation**: Invalid provider names are detected and logged with fallback behavior

## Build Process

The build process uses Bun with extensive externalization of AI SDK packages to keep the bundle size manageable. All TypeScript files (`index.ts`, `message.ts`, `cli.tsx`, `app.tsx`) are built separately with appropriate external dependencies for React, ink, and AI SDKs.

### Key Build Considerations
- React and ink dependencies are externalized to keep bundle size down
- TSX files are compiled to JS while maintaining proper module imports
- The build output maintains npx compatibility through index.js entry point

## CLI Usage Modes

The tool supports two operation modes:

### Default Mode (Automatic Commit)
```bash
npx registrar
```
- Generates commit message from staged changes
- Automatically commits the changes with the generated message
- Shows progress through: checking → generating → committing → success

### Message-Only Mode (Git Hook Integration)
```bash
npx registrar --message-only
npx registrar --no-commit  # Same as --message-only
```
- Generates commit message from staged changes
- Displays the message without committing
- Shows progress through: checking → generating → message-only
- Perfect for git hook integration (prepare-commit-msg, commit-msg)

### Command Line Argument Parsing
- `index.ts` parses `process.argv` to detect `--message-only` or `--no-commit` flags
- Passes `{ messageOnly: boolean }` options to `runApp()`
- Both flags provide identical functionality for user convenience

## API Integration

Each provider requires its own API key set as an environment variable (e.g., `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`). The system automatically maps providers to their expected environment variable names.

## UI/UX Implementation

The CLI interface uses React with ink to provide rich terminal interactions:

- **Status Phases**: checking → generating → committing/message-only → success/error
- **Progress Indicators**: Animated spinners during async operations
- **Timer Display**: Real-time elapsed time counter during generation and commit phases
- **Visual Feedback**: Green checkmarks for success, red X for errors
- **Message Display**: Shows commit messages and error details

### Ink Integration Notes
- `render()` immediately starts display, `rerender()` updates the same instance
- Timer functionality uses `setInterval` with React `useEffect` for state management
- Components are tested with `ink-testing-library` for UI behavior verification

## Code Quality and Linting

- **Type Checking**: Uses Bun's native TypeScript support with `bun --bun tsc --noEmit`
- **Linting Scripts**: `bun run lint` and `bun run typecheck` for code quality checks
- **No External Linters**: Leverages Bun's built-in capabilities instead of ESLint/Prettier
- **Build Validation**: TypeScript compilation catches type errors during build process

## Message Generation Implementation

### Core Utilities in message.ts
- **`toCamelCase(str: string)`**: Converts snake_case strings to camelCase
- **`convertKeysToCamelCase(obj)`**: Recursively converts object keys from snake_case to camelCase
- **`loadConfig()`**: Loads and validates TOML configuration with automatic key conversion
- **`generateCommit()`**: Orchestrates AI provider creation and structured commit message generation
- **`commitMessage()`**: Handles prompt templating and diff interpolation

### Error Handling Strategy
- **Graceful Degradation**: Config parsing errors fall back to defaults
- **Provider Validation**: Invalid provider names are caught and logged
- **API Failures**: Provider creation and generation failures are properly caught and re-thrown
- **Type Safety**: Zod schema validation ensures consistent commit message structure