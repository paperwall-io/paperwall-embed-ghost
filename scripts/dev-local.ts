#!/usr/bin/env bun
/**
 * Starts the dev server with paperwall-lib linked from the local filesystem.
 *
 * Usage: bun run dev:local
 */
import { $ } from "bun";

const libPath = new URL("../../paperwall-lib", import.meta.url).pathname;

console.log(`Linking paperwall → ${libPath}`);

// Step 1: Register paperwall-lib as a linkable package
await $`bun link`.cwd(libPath).quiet();
// Step 2: Link it into this project
await $`bun link paperwall`.quiet();

try {
  await $`varlock run -- vite --host embed.pw.local --port 5174`;
} finally {
  // Restore the published dependency on exit
  await $`bun install --force`.quiet();
}
