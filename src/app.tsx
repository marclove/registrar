import { copyFileSync, existsSync } from "fs";
import { render } from "ink";
import { dirname, join } from "path";
import simpleGit from "simple-git";
import { fileURLToPath } from "url";
import Cli from "./cli.js";
import commitMessage from "./message.js";
import { EnhancedGit, validateGitState } from "./git-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runInit() {
  const sourcePath = join(__dirname, "default.toml");
  const destPath = join(process.cwd(), "llmc.toml");

  if (existsSync(destPath)) {
    console.error("llmc.toml already exists in the current directory.");
    process.exit(1);
  }

  try {
    copyFileSync(sourcePath, destPath);
    console.log("llmc.toml created successfully.");
  } catch (error) {
    console.error("Failed to create llmc.toml:", error);
    process.exit(1);
  }
}

interface RunAppOptions {
  messageOnly?: boolean;
}

export async function runApp(options: RunAppOptions = {}) {
  // Check if we're in message-only mode and stdout is not a TTY (being redirected)
  const isNonInteractive = options.messageOnly && !process.stdout.isTTY;

  // Only render UI if we're in an interactive terminal
  const { rerender } = isNonInteractive
    ? { rerender: () => {} }
    : render(<Cli status="checking" />);

  try {
    // Validate git state with enhanced error messages
    const gitValidation = await validateGitState();
    if (!gitValidation.isValid) {
      const errorMessage = gitValidation.details 
        ? `${gitValidation.message}${gitValidation.details}`
        : gitValidation.message;
        
      if (isNonInteractive) {
        console.error(errorMessage);
        process.exit(1);
      } else {
        rerender(
          <Cli
            status="error"
            error={errorMessage}
          />,
        );
        setTimeout(() => process.exit(1), 1000);
      }
      return;
    }

    // Get staged diff using enhanced git wrapper
    const enhancedGit = new EnhancedGit();
    const diff = await enhancedGit.getStagedDiff();

    // Retry logic for commit message generation
    const maxAttempts = 3;
    let attempt = 1;
    let msg: string | null = null;
    let lastError: Error | null = null;

    while (attempt <= maxAttempts && !msg) {
      try {
        // Update status based on attempt number
        if (!isNonInteractive) {
          if (attempt === 1) {
            rerender(<Cli status="generating" />);
          } else {
            rerender(
              <Cli
                status="retrying"
                attempt={attempt}
                maxAttempts={maxAttempts}
              />,
            );
          }
        }

        msg = await commitMessage(diff);

        // If we get here, generation was successful
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxAttempts) {
          // This was the final attempt, break out of the loop
          break;
        }

        // Wait a bit before retrying to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempt++;
      }
    }

    // Check if we successfully generated a message
    if (!msg) {
      const errorMessage = lastError?.message || "Unknown error occurred";
      if (isNonInteractive) {
        console.error(`Failed to generate commit message after ${maxAttempts} attempts. Last error: ${errorMessage}`);
        process.exit(1);
      } else {
        rerender(
          <Cli
            status="error"
            error={`Failed to generate commit message after ${maxAttempts} attempts. Last error: ${errorMessage}`}
          />,
        );
        setTimeout(() => process.exit(1), 2000);
      }
      return;
    }

    if (options.messageOnly) {
      if (isNonInteractive) {
        // Output just the plain message for git hooks
        console.log(msg);
        process.exit(0);
      } else {
        // Show the generated message and exit
        rerender(<Cli status="message-only" message={msg} />);
        setTimeout(() => process.exit(0), 1500);
      }
    } else {
      // Update to committing status and show the message
      rerender(<Cli status="committing" message={`Commit message: ${msg}`} />);

      await enhancedGit.commit(msg);

      // Show success
      rerender(
        <Cli status="success" message={`Committed with message: ${msg}`} />,
      );

      // Exit gracefully after showing success
      setTimeout(() => process.exit(0), 1500);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (isNonInteractive) {
      console.error(`Error: ${errorMessage}`);
      process.exit(1);
    } else {
      rerender(
        <Cli
          status="error"
          error={`Error: ${errorMessage}`}
        />,
      );

      setTimeout(() => process.exit(1), 2000);
    }
  }
}
