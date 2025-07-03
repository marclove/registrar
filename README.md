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

## Quick Start

### Using npx (Recommended)

```bash
# Stage your changes
git add .

# Generate commit message and commit automatically
npx registrar
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

## Alternative: Git Hook Integration

> **Note**: Since Registrar now handles committing automatically, you typically don't need git hooks. However, if you prefer to generate commit messages without auto-committing, you can still use git hooks with a message-only mode.

### Manual Setup (prepare-commit-msg hook)

If you want to use git hooks to generate commit messages without auto-committing, you would need to create a separate message-only version of the tool. The current version automatically commits after generating the message.

For now, the recommended approach is to use `npx registrar` directly, which provides a better user experience with visual progress indicators and automatic commit handling.

## Usage Examples

### Basic Usage

```bash
# Stage your changes
git add .

# Generate commit message and commit automatically
npx registrar
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