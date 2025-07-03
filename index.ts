#!/usr/bin/env node

import simpleGit from "simple-git";
import commitMessage from "./message.js";

async function main() {
  const git = simpleGit();
  const diff = await git.diff({ "--cached": null });

  if (!diff) {
    console.error("You must stage changes before generating a commit message.");
    process.exit(1);
  }

  try {
    const msg = await commitMessage(diff);
    console.log("Committing…");
    console.log(msg);
    await git.commit(msg);
    console.log("Committed.");
  } catch (error) {
    console.error("Error generating commit message:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
