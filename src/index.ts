#!/usr/bin/env node

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runApp, runInit } from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  const packageJsonPath = join(__dirname, "../package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .scriptName("llmc")
    .usage("Usage: llmc [command] [options]")
    .command(
      "init",
      "Initialize llmc by creating an llmc.toml configuration file with default values",
      () => {},
      async () => {
        await runInit();
        process.exit(0);
      },
    )
    .epilogue("llmc is a tool for generating commit messages using LLMs. It's an abbreviation of \"LLM Commit\".\n")
    .epilogue("See https://github.com/llm-commit/llmc for more usage information.")
    .option("no-commit", {
      type: "boolean",
      description: "Generate message only without committing",
    })
    .option("message-only", {
      type: "boolean",
      description: "Generate message only without committing",
    })
    .help()
    .alias("help", "h")
    .version(getVersion())
    .alias("version", "v")
    .strict()
    .parserConfiguration({
      "boolean-negation": false,
    })
    .demandCommand(0, 1, "", "No command provided, proceeding with default action.")
    .argv;

  const messageOnly = argv["no-commit"] || argv["message-only"];

  // Check if a command was handled or if we should run the default app logic
  if (argv._.length === 0) {
    await runApp({ messageOnly });
  }
}

main();
