/**
 * Blessed UI layer for the CLI game.
 * @module ui
 */

"use strict";

import * as blessed from "blessed";
import {
  GameState,
  autoMove,
  cancelHeld,
  createGame,
  handleEnter,
  moveCursor,
  normalizeState,
} from "./game";
import { renderBoard, renderHelp, renderInfo } from "./render";

/**
 * Start the interactive UI loop.
 * @param {{ drawCount?: number; seed?: number; useColor?: boolean; compact?: boolean }} options Startup options.
 * @returns {void}
 */
export function startUi(
  options: {
    drawCount?: number;
    seed?: number;
    useColor?: boolean;
    compact?: boolean;
  } = {},
): void {
  let state = createGame({ drawCount: options.drawCount, seed: options.seed });

  const screen = blessed.screen({ smartCSR: true, fullUnicode: true });
  screen.title = "Klondike Solitaire";

  const boardBox = blessed.box({
    top: 0,
    left: 0,
    width: "70%",
    height: "100%-4",
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

  screen.append(boardBox);
  screen.append(infoBox);
  screen.append(helpBox);

  /**
   * Render the UI from the current state.
   * @returns {void}
   */
  function render(): void {
    const useColor = options.useColor !== false;
    boardBox.setContent(
      renderBoard(state, { useColor, compact: options.compact }),
    );
    infoBox.setContent(renderInfo(state));
    helpBox.setContent(renderHelp());
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
  screen.key(["escape"], () => update(cancelHeld(state)));
  screen.key(["left", "right", "up", "down"], (ch, key) => {
    update(moveCursor(state, key.name as "left" | "right" | "up" | "down"));
  });
  screen.key(["w", "a", "s", "d"], (ch, key) => {
    const map: Record<string, "up" | "left" | "down" | "right"> = {
      w: "up",
      a: "left",
      s: "down",
      d: "right",
    };
    update(moveCursor(state, map[key.name]));
  });
  screen.key(["enter"], () => update(handleEnter(state)));
  screen.key(["space"], () => update(autoMove(state)));

  screen.on("resize", render);
  render();
}
