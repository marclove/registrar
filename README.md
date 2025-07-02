# Registrar

AI-powered commit message generator that follows Conventional Commits specification.

## Features

- 🤖 AI-generated commit messages using multiple providers (Anthropic, OpenAI, Google, etc.)
- 📝 Follows [Conventional Commits](https://www.conventionalcommits.org/) specification
- ⚙️ Configurable via TOML file with custom prompts
- 🔧 Easy integration with git hooks and Husky
- 🚀 Zero-config usage with sensible defaults

## Quick Start

### Using npx (Recommended)

```bash
# Generate a commit message from git diff
npx registrar "$(git diff --cached)"

# Or pipe git diff directly
git diff --cached | npx registrar
```

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

### Manual Setup (prepare-commit-msg hook)

1. Create the hook file:

```bash
touch .git/hooks/prepare-commit-msg
chmod +x .git/hooks/prepare-commit-msg
```

2. Add the following content to `.git/hooks/prepare-commit-msg`:

```bash
#!/bin/bash

# Only run for commits (not merges, rebases, etc.)
if [ "$2" = "message" ] || [ "$2" = "template" ] || [ "$2" = "merge" ] || [ "$2" = "squash" ]; then
    exit 0
fi

# Get the staged diff
DIFF=$(git diff --cached)

# Only generate if there are staged changes
if [ -n "$DIFF" ]; then
    # Generate commit message using registrar
    COMMIT_MSG=$(npx registrar "$DIFF" 2>/dev/null)
    
    # If generation was successful, use it
    if [ $? -eq 0 ] && [ -n "$COMMIT_MSG" ]; then
        echo "$COMMIT_MSG" > "$1"
    fi
fi
```

### Husky Setup

If you're using [Husky](https://typicode.github.io/husky/) for git hooks:

1. Install Husky (if not already installed):

```bash
npm install --save-dev husky
npx husky install
```

2. Add the prepare-commit-msg hook:

```bash
npx husky add .husky/prepare-commit-msg 'npx registrar "$(git diff --cached)" > $1 2>/dev/null || true'
```

Or create `.husky/prepare-commit-msg` manually:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Only run for regular commits
if [ "$2" = "message" ] || [ "$2" = "template" ] || [ "$2" = "merge" ] || [ "$2" = "squash" ]; then
    exit 0
fi

# Generate commit message
DIFF=$(git diff --cached)
if [ -n "$DIFF" ]; then
    COMMIT_MSG=$(npx registrar "$DIFF" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$COMMIT_MSG" ]; then
        echo "$COMMIT_MSG" > "$1"
    fi
fi
```

3. Make it executable:

```bash
chmod +x .husky/prepare-commit-msg
```

## Usage Examples

### Basic Usage

```bash
# Stage your changes
git add .

# Generate commit message
npx registrar "$(git diff --cached)"

# Or commit directly (with git hook setup)
git commit
```

### Custom Configuration

```bash
# Use different provider
echo 'provider = "openai"' > config.toml
npx registrar "$(git diff --cached)"

# Use custom prompt
cat > config.toml << EOF
provider = "anthropic"
prompt = """
Create a commit message for this diff: \${diff}
Make it concise and professional.
"""
EOF
```

### Integration with Git Workflow

```bash
# 1. Stage your changes
git add src/components/Button.tsx

# 2. Generate and commit (with hook)
git commit

# 3. The hook automatically generates a message like:
# "feat(components): add new Button component with accessibility features"
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
   # Make sure you have staged changes
   git add .
   git diff --cached
   ```

3. **Hook Not Running**
   ```bash
   # Check hook permissions
   ls -la .git/hooks/prepare-commit-msg
   # Should show executable permissions (-rwxr-xr-x)
   ```

### Debug Mode

```bash
# Run with debug output
DEBUG=1 npx registrar "$(git diff --cached)"
```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.