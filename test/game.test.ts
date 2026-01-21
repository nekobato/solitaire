/**
 * Unit tests for game logic.
 * @module test-game
 */

"use strict";

import test = require("node:test");
import assert = require("node:assert/strict");
import {
  Card,
  Suit,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  createDeck,
  createGame,
  drawFromStock,
} from "../src/game";

/**
 * Create a card helper for tests.
 * @param {Suit} suit Suit.
 * @param {number} rank Rank.
 * @param {boolean} faceUp Face-up flag.
 * @returns {Card} Card object.
 */
function card(suit: Suit, rank: number, faceUp = true): Card {
  return { suit, rank, faceUp };
}

test("createDeck returns 52 unique cards", () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  const ids = new Set(deck.map((c) => `${c.suit}-${c.rank}`));
  assert.equal(ids.size, 52);
});

test("createGame deals tableau and stock correctly", () => {
  const state = createGame({ seed: 1 });
  const sizes = state.tableau.map((col) => col.length);
  assert.deepEqual(sizes, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(state.stock.length, 24);
  assert.equal(state.waste.length, 0);
  state.tableau.forEach((col) => {
    const faceUp = col.filter((c) => c.faceUp).length;
    assert.equal(faceUp, 1);
    assert.ok(col[col.length - 1].faceUp);
  });
});

test("canPlaceOnTableau enforces alternating colors and descending ranks", () => {
  const redSeven = [card("H", 7)];
  const blackEight = [card("S", 8)];
  const redEight = [card("D", 8)];
  assert.equal(canPlaceOnTableau(redSeven, blackEight), true);
  assert.equal(canPlaceOnTableau(redSeven, redEight), false);
  assert.equal(canPlaceOnTableau(redSeven, [card("S", 9)]), false);
  assert.equal(canPlaceOnTableau([card("S", 13)], []), true);
  assert.equal(canPlaceOnTableau([card("S", 12)], []), false);
});

test("canPlaceOnFoundation enforces suit and ascending rank", () => {
  assert.equal(canPlaceOnFoundation(card("S", 1), []), true);
  assert.equal(canPlaceOnFoundation(card("S", 2), []), false);
  assert.equal(canPlaceOnFoundation(card("S", 2), [card("S", 1)]), true);
  assert.equal(canPlaceOnFoundation(card("H", 2), [card("S", 1)]), false);
});

test("drawFromStock moves cards to waste and handles redeal", () => {
  const state = createGame({ seed: 2, drawCount: 3 });
  const afterDraw = drawFromStock(state);
  assert.equal(afterDraw.waste.length, 3);
  assert.equal(afterDraw.stock.length, 21);
  afterDraw.waste.forEach((c) => assert.equal(c.faceUp, true));

  const emptyStock = {
    ...afterDraw,
    stock: [],
    waste: [card("S", 5), card("S", 6), card("S", 7)],
  };
  const redealt = drawFromStock(emptyStock);
  assert.equal(redealt.stock.length, 3);
  assert.equal(redealt.waste.length, 0);
  redealt.stock.forEach((c) => assert.equal(c.faceUp, false));
});
