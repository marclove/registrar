#!/usr/bin/env node

import { runApp } from "./app.js";

async function main() {
  const args = process.argv.slice(2);
  const messageOnly = args.includes('--no-commit') || args.includes('--message-only');
  
  await runApp({ messageOnly });
}

main();
