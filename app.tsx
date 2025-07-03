import { render } from "ink";
import simpleGit from "simple-git";
import Cli from "./cli.js";
import commitMessage from "./message.js";

interface RunAppOptions {
  messageOnly?: boolean;
}

export async function runApp(options: RunAppOptions = {}) {
  // Start with checking status - render() immediately starts displaying
  const { rerender } = render(<Cli status="checking" />);

  try {
    const git = simpleGit();
    const diff = await git.diff({ "--cached": null });

    if (!diff) {
      rerender(
        <Cli
          status="error"
          error="You must stage changes before generating a commit message."
        />,
      );
      setTimeout(() => process.exit(1), 1000);
      return;
    }

    // Retry logic for commit message generation
    const maxAttempts = 3;
    let attempt = 1;
    let msg: string | null = null;
    let lastError: Error | null = null;

    while (attempt <= maxAttempts && !msg) {
      try {
        // Update status based on attempt number
        if (attempt === 1) {
          rerender(<Cli status="generating" />);
        } else {
          rerender(<Cli
            status="retrying"
            attempt={attempt}
            maxAttempts={maxAttempts}
          />);
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
      rerender(
        <Cli
          status="error"
          error={`Failed to generate commit message after ${maxAttempts} attempts. Last error: ${errorMessage}`}
        />,
      );
      setTimeout(() => process.exit(1), 2000);
      return;
    }

    if (options.messageOnly) {
      // Show the generated message and exit
      rerender(<Cli status="message-only" message={msg} />);
      setTimeout(() => process.exit(0), 1500);
    } else {
      // Update to committing status and show the message
      rerender(<Cli status="committing" message={`Commit message: ${msg}`} />);

      await git.commit(msg);

      // Show success
      rerender(
        <Cli status="success" message={`Committed with message: ${msg}`} />,
      );

      // Exit gracefully after showing success
      setTimeout(() => process.exit(0), 1500);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    rerender(
      <Cli
        status="error"
        error={`Error: ${errorMessage}`}
      />,
    );

    setTimeout(() => process.exit(1), 2000);
  }
}
