#!/usr/bin/env node

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runApp } from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  const packageJsonPath = join(__dirname, "../package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
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
      "boolean-negation": false
    })
    .argv;

  const messageOnly = argv["no-commit"] || argv["message-only"];

  await runApp({ messageOnly });
}

main();
