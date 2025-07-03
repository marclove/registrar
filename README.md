# Registrar

AI-powered commit message generator that follows Conventional Commits specification. Simply run `npx registrar` and it will automatically generate a commit message from your staged changes and commit them for you.

## Features

- 🤖 AI-generated commit messages using multiple providers (Anthropic, OpenAI, Google, etc.)
- 📝 Follows [Conventional Commits](https://www.conventionalcommits.org/) specification
- ⚙️ Configurable via TOML file with custom prompts
- 🔄 Automatic retry logic with visual progress indicators
- 🎨 Rich terminal UI with real-time status updates and timers
- 🚀 Zero-config usage with sensible defaults
- ✨ Automatically commits your changes after generating the message
- 🔗 Git hook integration with message-only mode

## Quick Start

### Using npx (Recommended)

```bash
# Stage your changes
git add .

# Generate commit message and commit automatically
npx registrar

# Or just generate the message without committing (for git hooks)
npx registrar --message-only
```

That's it! Registrar will:
1. ✅ Check for staged changes
2. 🤖 Generate a commit message using AI
3. 📝 Commit your changes with the generated message
4. 🎉 Show you the result with a beautiful progress interface

### Installation

```bash
npm install -g registrar
```

## Configuration

Create a `config.toml` file in your project root:

```toml
provider = "anthropic"
model = "claude-sonnet-4-20250514"
max_tokens = 250
temperature = 1.0
api_key_name = "ANTHROPIC_API_KEY"

# Optional: Custom prompt with ${diff} interpolation
prompt = """
Analyze this git diff and generate a commit message following Conventional Commits.

Git diff:
${diff}

Provide a clear, concise commit message.
"""
```

### Supported Providers

- `anthropic` - Claude models (default)
- `openai` - GPT models
- `google` - Gemini models
- `groq` - Fast inference
- `cerebras` - High-performance models
- `cohere` - Command models
- `deepseek` - DeepSeek models
- `mistral` - Mistral models
- `perplexity` - Perplexity models
- `replicate` - Replicate models
- `togetherai` - Together AI models
- `vercel` - Vercel AI models
- `xai` - xAI models

### Environment Variables

Set the appropriate API key for your chosen provider:

```bash
export ANTHROPIC_API_KEY="your-api-key"
export OPENAI_API_KEY="your-api-key"
export GOOGLE_API_KEY="your-api-key"
# ... etc
```

## Git Hook Integration

For git hook integration, use the `--message-only` or `--no-commit` flags to generate commit messages without automatically committing:

```bash
npx registrar --message-only
npx registrar --no-commit  # Same as --message-only
```

### prepare-commit-msg Hook Setup

Create `.git/hooks/prepare-commit-msg`:

```bash
#!/bin/sh
# Generate commit message using Registrar
npx registrar --message-only > "$1"
```

Make it executable:
```bash
chmod +x .git/hooks/prepare-commit-msg
```

Now when you run `git commit`, Registrar will automatically generate the commit message for you.

### commit-msg Hook Setup

For validation and generation combined:

```bash
#!/bin/sh
# Generate commit message if none provided
if [ -z "$(cat $1 | grep -v '^#')" ]; then
    npx registrar --message-only > "$1"
fi
```

## Usage Examples

### Basic Usage

```bash
# Stage your changes
git add .

# Generate commit message and commit automatically
npx registrar

# Generate message only (for git hooks)
npx registrar --message-only
```

### Custom Configuration

```bash
# Use different provider
echo 'provider = "openai"' > config.toml
npx registrar

# Use custom prompt
cat > config.toml << EOF
provider = "anthropic"
prompt = """
Create a commit message for this diff: \${diff}
Make it concise and professional.
"""
EOF
npx registrar
```

### Example Output

When you run `npx registrar`, you'll see a beautiful progress interface:

```
⠋ Checking for staged changes...
⠋ Generating commit message...
Time elapsed: 2s
⠋ Committing changes...
✓ Committed successfully!
Commit message: feat(components): add new Button component with accessibility features
```

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```bash
   # Make sure your API key is set
   echo $ANTHROPIC_API_KEY
   ```

2. **No Staged Changes**
   ```bash
   # Make sure you have staged changes first
   git add .

   # Verify you have staged changes
   git diff --cached
   ```

3. **Generation Failures**
   Registrar automatically retries up to 3 times if generation fails. You'll see:
   ```
   ⠋ Retrying commit message generation (attempt 2/3)...
   Previous attempt failed. Retrying... (1 failed attempts)
   ```

4. **Commit Failures**
   If the commit fails, check that:
   - You have write permissions to the repository
   - You're in a git repository
   - There are actually staged changes to commit

### Error Handling

Registrar provides detailed error messages and visual feedback:
- ✅ Green checkmark for success
- ❌ Red X for errors
- 🔄 Automatic retry with progress indicators
- ⏱️ Real-time timer showing elapsed time

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

### Publishing to npm

For maintainers, here's how to publish new versions to npm:

1. **Ensure all tests pass**:
   ```bash
   bun test
   bun run lint
   ```

2. **Update version in package.json**:
   ```bash
   # For patch releases (bug fixes)
   npm version patch

   # For minor releases (new features)
   npm version minor

   # For major releases (breaking changes)
   npm version major
   ```

3. **Build and publish**:
   ```bash
   # The prepublishOnly script will automatically run 'bun run build'
   bun publish
   # OR use npm (both work the same)
   npm publish
   ```

4. **Push the version tag**:
   ```bash
   git push origin main --tags
   ```

#### npx Functionality

The npx functionality is already fully configured in `package.json`:
- ✅ `"bin": { "registrar": "./dist/index.js" }` - enables `npx registrar`
- ✅ `"main": "dist/index.js"` - sets the entry point
- ✅ `"files": ["dist/"]` - includes built files in npm package
- ✅ `"prepublishOnly": "bun run build"` - builds before publishing

No additional setup is needed for npx functionality - it works automatically once the package is published to npm.
