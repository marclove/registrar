import { render } from "ink";
import simpleGit from "simple-git";
import Cli from "./cli.js";
import commitMessage from "./message.js";

export async function runApp() {
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

    // Update to generating status
    rerender(<Cli status="generating" />);

    const msg = await commitMessage(diff);

    // Update to committing status and show the message
    rerender(<Cli status="committing" message={`Commit message: ${msg}`} />);

    await git.commit(msg);

    // Show success
    rerender(
      <Cli status="success" message={`Committed with message: ${msg}`} />,
    );

    // Exit gracefully after showing success
    setTimeout(() => process.exit(0), 1500);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    rerender(
      <Cli
        status="error"
        error={`Error generating commit message: ${errorMessage}`}
      />,
    );

    setTimeout(() => process.exit(1), 2000);
  }
}
