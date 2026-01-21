/**
 * Rendering tests for board styles.
 * @module test-render
 */

"use strict";

import test = require("node:test");
import assert = require("node:assert/strict");
import { createGame } from "../src/game";
import { renderBoard } from "../src/render";

test("renderBoard defaults to rich cards", () => {
  const state = createGame({ seed: 1 });
  const output = renderBoard(state, { useColor: false });
  assert.match(output, /╭──────╮/);
});

test("renderBoard supports compact cards", () => {
  const state = createGame({ seed: 1 });
  const output = renderBoard(state, { useColor: false, compact: true });
  assert.match(output, /\[[^\n]{1,4}\]/);
  assert.doesNotMatch(output, /╭──────╮/);
});
