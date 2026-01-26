#!/usr/bin/env node
/**
 * CLI entry point for the solitaire game.
 * @module cli
 */

"use strict";

import * as fs from "node:fs";
import * as path from "node:path";
import { startUi } from "./lib/ui";
import { GameKind, createGame, drawFromStock, isGameKind } from "./lib/game";
import {
  DEFAULT_THEME_NAME,
  ThemeName,
  isThemeName,
  listThemes,
} from "./lib/theme";

/**
 * CLI options.
 */
interface CliOptions {
  help: boolean;
  version: boolean;
  game: GameKind;
  drawCount: number;
  seed?: number;
  useColor: boolean;
  smoke: boolean;
  compact: boolean;
  theme: ThemeName;
}

/**
 * Read package version.
 * @returns {string} Version string.
 */
function readVersion(): string {
  const pkgPath = path.join(__dirname, "../package.json");
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
    game: "klondike",
    drawCount: 1,
    useColor: true,
    smoke: false,
    compact: false,
    theme: DEFAULT_THEME_NAME,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--version" || arg === "-v") {
      options.version = true;
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
    } else if (arg.startsWith("--game=")) {
      const value = arg.split("=")[1];
      if (isGameKind(value)) options.game = value;
    } else if (arg === "--game") {
      const value = args[i + 1];
      if (isGameKind(value)) options.game = value;
      i += 1;
    } else if (arg === "--no-color") {
      options.useColor = false;
    } else if (arg === "--compact") {
      options.compact = true;
    } else if (arg.startsWith("--theme=")) {
      const value = arg.split("=")[1];
      if (isThemeName(value)) options.theme = value;
    } else if (arg === "--theme") {
      const value = args[i + 1];
      if (isThemeName(value)) options.theme = value;
      i += 1;
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
  const themeList = listThemes().join("|");
  const lines = [
    "Usage: npx @nekobato/solitaire [options]",
    "",
    "Options:",
    "  --game <klondike|freecell>  Select game (default: klondike)",
    "  --draw <1|3>       Draw count (Klondike only, default: 1)",
    "  --seed <number>    Deterministic shuffle seed",
    "  --no-color         Disable ANSI colors",
    "  --compact          Use compact card rendering",
    `  --theme <${themeList}>  Color theme (default: ${DEFAULT_THEME_NAME})`,
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
  const state = createGame({ drawCount: 1, seed: 42, game: "klondike" });
  if (state.kind !== "klondike") {
    console.error("SMOKE_FAIL");
    process.exit(1);
  }
  const next = drawFromStock(state);
  if (!next || next.kind !== "klondike" || next.waste.length === 0) {
    console.error("SMOKE_FAIL");
    process.exit(1);
  }
  console.log("SMOKE_OK");
  process.exit(0);
}

function runSmokeForGame(game: GameKind): void {
  if (game === "freecell") {
    const state = createGame({ seed: 42, game });
    if (state.kind !== "freecell" || state.freecells.length !== 4) {
      console.error("SMOKE_FAIL");
      process.exit(1);
    }
    console.log("SMOKE_OK");
    process.exit(0);
  }
  runSmoke();
}

/**
 * Main entry.
 * @returns {void}
 */
function main(): void {
  const options = parseArgs(process.argv);
  if (options.help) return printHelp();
  if (options.version) {
    console.log(readVersion());
    return;
  }
  if (options.smoke) return runSmokeForGame(options.game);

  startUi({
    game: options.game,
    drawCount: options.drawCount,
    seed: options.seed,
    useColor: options.useColor,
    compact: options.compact,
    theme: options.theme,
  });
}

main();
