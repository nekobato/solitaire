#!/usr/bin/env node
/**
 * CLI entry point for the solitaire game.
 * @module cli
 */

"use strict";

import * as fs from "node:fs";
import * as path from "node:path";
import { startUi } from "../src/ui";
import { createGame, drawFromStock } from "../src/game";

/**
 * CLI options.
 */
interface CliOptions {
  help: boolean;
  version: boolean;
  drawCount: number;
  seed?: number;
  useColor: boolean;
  smoke: boolean;
  compact: boolean;
}

/**
 * Read package version.
 * @returns {string} Version string.
 */
function readVersion(): string {
  const pkgPath = path.join(__dirname, "..", "..", "package.json");
  const raw = fs.readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(raw) as { version?: string };
  return pkg.version || "0.0.0";
}

/**
 * Parse CLI arguments.
 * @param {string[]} argv Process argv.
 * @returns {CliOptions} Parsed options.
 */
function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const options: CliOptions = {
    help: false,
    version: false,
    drawCount: 3,
    useColor: true,
    smoke: false,
    compact: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--version" || arg === "-v") {
      options.version = true;
    } else if (arg === "--easy") {
      options.drawCount = 1;
    } else if (arg.startsWith("--draw=")) {
      const value = Number(arg.split("=")[1]);
      if (value === 1 || value === 3) options.drawCount = value;
    } else if (arg === "--draw") {
      const value = Number(args[i + 1]);
      if (value === 1 || value === 3) options.drawCount = value;
      i += 1;
    } else if (arg.startsWith("--seed=")) {
      const value = Number(arg.split("=")[1]);
      if (!Number.isNaN(value)) options.seed = value;
    } else if (arg === "--seed") {
      const value = Number(args[i + 1]);
      if (!Number.isNaN(value)) options.seed = value;
      i += 1;
    } else if (arg === "--no-color") {
      options.useColor = false;
    } else if (arg === "--compact") {
      options.compact = true;
    } else if (arg === "--smoke") {
      options.smoke = true;
    }
  }

  return options;
}

/**
 * Print CLI usage help.
 * @returns {void}
 */
function printHelp(): void {
  const lines = [
    "Usage: npx @nekobato/solitaire [options]",
    "",
    "Options:",
    "  --easy            Draw 1 card from stock (easier mode)",
    "  --draw <1|3>       Draw count (default: 3)",
    "  --seed <number>    Deterministic shuffle seed",
    "  --no-color         Disable ANSI colors",
    "  --compact          Use compact card rendering",
    "  --help, -h         Show this help",
    "  --version, -v      Print version",
    "  --smoke            Run a smoke test and exit",
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

/**
 * Run a non-interactive smoke test.
 * @returns {void}
 */
function runSmoke(): void {
  const state = createGame({ drawCount: 1, seed: 42 });
  const next = drawFromStock(state);
  if (!next || next.waste.length === 0) {
    process.stderr.write("SMOKE_FAIL\n");
    process.exit(1);
  }
  process.stdout.write("SMOKE_OK\n");
  process.exit(0);
}

/**
 * Main entry.
 * @returns {void}
 */
function main(): void {
  const options = parseArgs(process.argv);
  if (options.help) return printHelp();
  if (options.version) {
    process.stdout.write(readVersion() + "\n");
    return;
  }
  if (options.smoke) return runSmoke();

  startUi({
    drawCount: options.drawCount,
    seed: options.seed,
    useColor: options.useColor,
    compact: options.compact,
  });
}

main();
