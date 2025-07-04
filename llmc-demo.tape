# llmc-demo.tape
# This tape demonstrates the basic usage of llmc.

# Set the output file for the GIF.
Output "llmc-demo.gif"

# Set the terminal window properties for a clean recording.
Set Width 1400
Set Height 800
Set FontSize 24
Set FontFamily "CaskaydiaCove Nerd Font"
Set LineHeight 1.5
Set TypingSpeed 100ms
Set Theme "TokyoNightStorm"
Set Margin 60
Set WindowBar Colorful
Set Margin 20
Set MarginFill "#8089b3"
Set BorderRadius 10

# Use a simple bash prompt.
Set Shell "zsh"

# Start in a fresh directory for the demo.
Type "mkdir llmc-demo && cd llmc-demo"
Enter
Sleep 3s

# Initialize a new git repository.
Type "git init"
Enter
Sleep 3s

# Configure git user details. This part is hidden from the recording
# as it's setup and not part of the core llmc demonstration.
Hide
Type "git config user.name 'LLMC Demo'"
Enter
Type "git config user.email 'llmc@example.com'"
Enter
Show

# Create a new TypeScript source file with some content using a HEREDOC.
Type "cat << 'EOF' > index.ts"
Enter
Type "function greet(name: string): string {"
Enter
Type "  return `Hello, ${name}!`;"
Enter
Type "}"
Enter
Type ""
Enter
Type "console.log(greet('world'));"
Enter
Type "EOF"
Enter
Sleep 3s

# Stage the new file to be committed.
Type "git add index.ts"
Enter

Sleep 3s

# Display the git status to show that the file is staged.
Type "git status"
Enter
Sleep 3s

# Execute llmc to generate a commit message and perform the commit.
# Note: This step assumes that an AI provider (like OpenAI or Anthropic)
# is configured via environment variables (e.g., OPENAI_API_KEY).
Type "npx llmc"
Enter

# Wait for llmc to process the diff, generate the message, and commit.
# The spinner and status updates from llmc will be visible here.
Sleep 10s

# Display the latest commit in the log to show the generated message.
Type "git log"
Enter
Sleep 5s

# End of the demonstration.
