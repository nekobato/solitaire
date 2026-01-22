/**
 * Blessed UI layer for the CLI game.
 * @module ui
 */

"use strict";

import * as blessed from "blessed";
import {
  GameState,
  GameKind,
  autoMove,
  cancelHeld,
  createGame,
  handleEnter,
  moveCursor,
  normalizeState,
} from "./game";
import { renderBoard, renderHelp, renderInfo } from "./render";
import { resolveTheme, ThemeName } from "./theme";

/**
 * Start the interactive UI loop.
 * @param {{ drawCount?: number; seed?: number; useColor?: boolean; compact?: boolean }} options Startup options.
 * @returns {void}
 */
export function startUi(
  options: {
    game?: GameKind;
    drawCount?: number;
    seed?: number;
    useColor?: boolean;
    compact?: boolean;
    theme?: ThemeName;
  } = {},
): void {
  let state = createGame({
    drawCount: options.drawCount,
    seed: options.seed,
    game: options.game,
  });
  const theme = resolveTheme(options.theme);

  const screen = blessed.screen({ smartCSR: true, fullUnicode: true });
  screen.title =
    state.kind === "freecell" ? "FreeCell Solitaire" : "Klondike Solitaire";

  /**
   * Get the display title for a game kind.
   * @param {GameKind} kind Game kind.
   * @returns {string} Title label.
   */
  function getGameTitle(kind: GameKind): string {
    return kind === "freecell" ? "FreeCell Solitaire" : "Klondike Solitaire";
  }

  /**
   * Format elapsed time as mm:ss.
   * @param {number} startedAt Start timestamp.
   * @returns {string} Formatted time string.
   */
  function formatElapsed(startedAt: number): string {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  /**
   * Build a fresh game state based on the current options.
   * @returns {GameState} New game state.
   */
  function createFreshGame(): GameState {
    return createGame({
      drawCount: options.drawCount,
      seed: options.seed,
      game: options.game,
    });
  }

  const titleBox = blessed.box({
    top: 0,
    left: 0,
    width: "70%",
    height: 1,
    tags: true,
  });

  const boardBox = blessed.box({
    top: 1,
    left: 0,
    width: "70%",
    height: "100%-5",
    tags: true,
  });

  const infoBox = blessed.box({
    top: 0,
    left: "70%",
    width: "30%",
    height: "100%-4",
    tags: true,
  });

  const helpBox = blessed.box({
    bottom: 0,
    left: 0,
    width: "100%",
    height: 4,
    tags: true,
  });

  const winBox = blessed.box({
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    tags: true,
    align: "center",
    valign: "middle",
    hidden: true,
  });

  screen.append(titleBox);
  screen.append(boardBox);
  screen.append(infoBox);
  screen.append(helpBox);
  screen.append(winBox);

  /**
   * Render the win screen content.
   * @param {GameState} current Current state.
   * @returns {string} Win screen text.
   */
  function renderWinScreen(current: GameState): string {
    const title = getGameTitle(current.kind);
    const redeals = current.kind === "klondike" ? String(current.redeals) : "-";
    const time = formatElapsed(current.startedAt);
    const accent = theme.highlight.cursorSelected.border.fg ?? "green";
    const accentStart = `{${accent}-fg}`;
    const accentEnd = `{/${accent}-fg}`;
    const highlight = (text: string): string =>
      `${accentStart}{bold}${text}{/bold}${accentEnd}`;

    const banner = [
      "__        ___ _   _ ",
      "\\ \\      / (_) | | |",
      " \\ \\ /\\ / / _| |_| |",
      "  \\ V  V / | |  _  |",
      "   \\_/\\_/  |_|_| |_|",
    ].map(highlight);

    return [
      ...banner,
      "",
      `{bold}${title}{/bold}`,
      `Moves: ${current.moves}`,
      `Redeals: ${redeals}`,
      `Time: ${time}`,
      "",
      highlight("Q: quit  Enter: Replay"),
    ].join("\n");
  }

  /**
   * Render the UI from the current state.
   * @returns {void}
   */
  function render(): void {
    const useColor = options.useColor !== false;
    const title = getGameTitle(state.kind);
    titleBox.setContent(`{bold}${title}{/bold}`);
    boardBox.setContent(
      renderBoard(state, { useColor, compact: options.compact, theme }),
    );
    infoBox.setContent(renderInfo(state));
    helpBox.setContent(renderHelp(state.kind));
    if (state.won) {
      winBox.setContent(renderWinScreen(state));
      winBox.show();
      titleBox.hide();
      boardBox.hide();
      infoBox.hide();
      helpBox.hide();
    } else {
      winBox.hide();
      titleBox.show();
      boardBox.show();
      infoBox.show();
      helpBox.show();
    }
    screen.render();
  }

  /**
   * Update state and re-render.
   * @param {GameState} next Next state.
   * @returns {void}
   */
  function update(next: GameState): void {
    state = normalizeState(next);
    render();
  }

  /**
   * Exit the UI cleanly.
   * @returns {void}
   */
  function exit(): void {
    screen.destroy();
    process.exit(0);
  }

  screen.key(["q", "C-c"], exit);
  screen.key(["escape"], () => {
    if (state.won) return;
    update(cancelHeld(state));
  });
  screen.key(["left", "right", "up", "down"], (ch, key) => {
    if (state.won) return;
    update(moveCursor(state, key.name as "left" | "right" | "up" | "down"));
  });
  screen.key(["w", "a", "s", "d"], (ch, key) => {
    if (state.won) return;
    const map: Record<string, "up" | "left" | "down" | "right"> = {
      w: "up",
      a: "left",
      s: "down",
      d: "right",
    };
    update(moveCursor(state, map[key.name]));
  });
  screen.key(["enter"], () => {
    if (state.won) return update(createFreshGame());
    update(handleEnter(state));
  });
  screen.key(["space"], () => {
    if (state.won) return;
    update(autoMove(state));
  });

  screen.on("resize", render);
  render();
}
