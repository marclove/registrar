#!/usr/bin/env node

import { runApp } from "./app.js";

async function main() {
  await runApp();
}

if (import.meta.main) {
  main();
}
