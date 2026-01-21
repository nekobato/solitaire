/**
 * Game logic for Klondike Solitaire (CLI).
 * @module game
 */

"use strict";

/**
 * Suit identifier.
 */
export type Suit = "S" | "H" | "C" | "D";

/**
 * Card color.
 */
export type Color = "red" | "black";

/**
 * Card model.
 */
export interface Card {
  suit: Suit;
  rank: number;
  faceUp: boolean;
}

/**
 * Cursor position within the UI.
 */
export type Cursor =
  | { zone: "top"; index: number }
  | { zone: "tableau"; col: number; depth: number };

/**
 * Held card selection metadata.
 */
export type Held = {
  source:
    | { area: "tableau"; col: number; depth: number }
    | { area: "waste" }
    | { area: "foundation"; suit: Suit };
  count: number;
};

/**
 * Complete game state.
 */
export interface GameState {
  tableau: Card[][];
  foundations: Record<Suit, Card[]>;
  stock: Card[];
  waste: Card[];
  cursor: Cursor;
  held: Held | null;
  moves: number;
  redeals: number;
  drawCount: number;
  startedAt: number;
  message: string;
  won: boolean;
}

/**
 * Ordered suit list.
 */
export const SUITS: Suit[] = ["S", "H", "C", "D"];

const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

/**
 * Create a standard 52-card deck (all face down).
 * @returns {Card[]} Deck of cards.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  return deck;
}

/**
 * Create a deterministic RNG function from a numeric seed.
 * @param {number} seed Seed value.
 * @returns {() => number} RNG function.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/**
 * Shuffle an array of cards using Fisher-Yates.
 * @param {Card[]} deck Original deck.
 * @param {() => number} rng RNG to use.
 * @returns {Card[]} Shuffled deck.
 */
export function shuffleDeck(deck: Card[], rng: () => number): Card[] {
  const next = deck.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * Determine the color of a card.
 * @param {Card} card Card to inspect.
 * @returns {Color} Card color.
 */
export function getCardColor(card: Card): Color {
  return card.suit === "H" || card.suit === "D" ? "red" : "black";
}

/**
 * Build a fresh game state with a shuffled deck.
 * @param {{ drawCount?: number; seed?: number }} options Creation options.
 * @returns {GameState} Initial state.
 */
export function createGame(
  options: { drawCount?: number; seed?: number } = {},
): GameState {
  const drawCount = options.drawCount === 1 ? 1 : 3;
  const rng =
    typeof options.seed === "number"
      ? createSeededRng(options.seed)
      : Math.random;
  const deck = shuffleDeck(createDeck(), rng);

  const tableau: Card[][] = [];
  for (let col = 0; col < 7; col += 1) {
    const column: Card[] = [];
    for (let row = 0; row <= col; row += 1) {
      const card = deck.pop();
      if (!card) throw new Error("Deck ran out while dealing.");
      column.push(card);
    }
    const topIndex = column.length - 1;
    column[topIndex] = { ...column[topIndex], faceUp: true };
    tableau.push(column);
  }

  const foundations: Record<Suit, Card[]> = { S: [], H: [], C: [], D: [] };

  const state: GameState = {
    tableau,
    foundations,
    stock: deck.map((card) => ({ ...card, faceUp: false })),
    waste: [],
    cursor: { zone: "tableau", col: 0, depth: 0 },
    held: null,
    moves: 0,
    redeals: 0,
    drawCount,
    startedAt: Date.now(),
    message: "",
    won: false,
  };

  return normalizeState(state);
}

/**
 * Get the first face-up index in a tableau column.
 * @param {Card[]} column Column to inspect.
 * @returns {number} Index of first face-up card.
 */
export function getFirstFaceUpIndex(column: Card[]): number {
  if (column.length === 0) return 0;
  const idx = column.findIndex((card) => card.faceUp);
  return idx === -1 ? column.length - 1 : idx;
}

/**
 * Normalize cursor and win state after mutations.
 * @param {GameState} state Current state.
 * @returns {GameState} Normalized state.
 */
export function normalizeState(state: GameState): GameState {
  const cursor = normalizeCursor(state);
  const won = isWin(state);
  return { ...state, cursor, won };
}

/**
 * Normalize the cursor depth to a valid row.
 * @param {GameState} state Current state.
 * @returns {Cursor} Normalized cursor.
 */
export function normalizeCursor(state: GameState): Cursor {
  if (state.cursor.zone !== "tableau") return state.cursor;
  const column = state.tableau[state.cursor.col] ?? [];
  if (column.length === 0) {
    return { zone: "tableau", col: state.cursor.col, depth: 0 };
  }
  const firstFaceUp = getFirstFaceUpIndex(column);
  const clampedDepth = Math.min(
    Math.max(state.cursor.depth, firstFaceUp),
    column.length - 1,
  );
  return { zone: "tableau", col: state.cursor.col, depth: clampedDepth };
}

/**
 * Find the top slot position list for cursor navigation.
 * @returns {{ kind: 'stock' | 'waste' | 'foundation'; suit?: Suit; x: number }[]} Slots.
 */
export function getTopSlots(): {
  kind: "stock" | "waste" | "foundation";
  suit?: Suit;
  x: number;
}[] {
  const cellSpan = 6;
  const columnX = [0, 1, 2, 3, 4, 5, 6].map((i) => i * cellSpan);
  const foundationOffset = cellSpan;
  return [
    { kind: "stock", x: columnX[0] },
    { kind: "waste", x: columnX[1] },
    { kind: "foundation", suit: "S", x: columnX[2] + foundationOffset },
    { kind: "foundation", suit: "H", x: columnX[3] + foundationOffset },
    { kind: "foundation", suit: "C", x: columnX[4] + foundationOffset },
    { kind: "foundation", suit: "D", x: columnX[5] + foundationOffset },
  ];
}

/**
 * Move the cursor in a given direction.
 * @param {GameState} state Current state.
 * @param {'left'|'right'|'up'|'down'} direction Direction to move.
 * @returns {GameState} Next state.
 */
export function moveCursor(
  state: GameState,
  direction: "left" | "right" | "up" | "down",
): GameState {
  const topSlots = getTopSlots();
  if (state.cursor.zone === "top") {
    const maxIndex = topSlots.length - 1;
    let nextIndex = state.cursor.index;
    if (direction === "left") nextIndex = Math.max(0, nextIndex - 1);
    if (direction === "right") nextIndex = Math.min(maxIndex, nextIndex + 1);
    if (direction === "down") {
      const slot = topSlots[state.cursor.index];
      const columnX = [0, 1, 2, 3, 4, 5, 6].map((i) => i * 6);
      const nearestCol = columnX.reduce(
        (best, x, col) => {
          const dist = Math.abs(x - slot.x);
          return dist < best.dist ? { col, dist } : best;
        },
        { col: 0, dist: Infinity },
      );
      return normalizeState({
        ...state,
        cursor: { zone: "tableau", col: nearestCol.col, depth: 0 },
        message: "",
      });
    }
    return normalizeState({
      ...state,
      cursor: { zone: "top", index: nextIndex },
      message: "",
    });
  }

  if (state.cursor.zone === "tableau") {
    const column = state.tableau[state.cursor.col] ?? [];
    const firstFaceUp = getFirstFaceUpIndex(column);
    if (direction === "left" || direction === "right") {
      const nextCol =
        direction === "left"
          ? Math.max(0, state.cursor.col - 1)
          : Math.min(6, state.cursor.col + 1);
      return normalizeState({
        ...state,
        cursor: { zone: "tableau", col: nextCol, depth: state.cursor.depth },
        message: "",
      });
    }
    if (direction === "up") {
      if (state.cursor.depth > firstFaceUp) {
        return normalizeState({
          ...state,
          cursor: {
            zone: "tableau",
            col: state.cursor.col,
            depth: state.cursor.depth - 1,
          },
          message: "",
        });
      }
      const columnX = state.cursor.col * 6;
      const nearestIndex = topSlots.reduce(
        (best, slot, index) => {
          const dist = Math.abs(slot.x - columnX);
          return dist < best.dist ? { index, dist } : best;
        },
        { index: 0, dist: Infinity },
      );
      return normalizeState({
        ...state,
        cursor: { zone: "top", index: nearestIndex.index },
        message: "",
      });
    }
    if (direction === "down") {
      if (column.length === 0) return state;
      if (state.cursor.depth < column.length - 1) {
        return normalizeState({
          ...state,
          cursor: {
            zone: "tableau",
            col: state.cursor.col,
            depth: state.cursor.depth + 1,
          },
          message: "",
        });
      }
    }
  }

  return state;
}

/**
 * Test if a sequence can be placed on a tableau column.
 * @param {Card[]} cards Sequence to move.
 * @param {Card[]} targetColumn Target tableau.
 * @returns {boolean} True if valid.
 */
export function canPlaceOnTableau(
  cards: Card[],
  targetColumn: Card[],
): boolean {
  if (cards.length === 0) return false;
  const first = cards[0];
  if (targetColumn.length === 0) {
    return first.rank === 13;
  }
  const target = targetColumn[targetColumn.length - 1];
  if (!target.faceUp) return false;
  return (
    getCardColor(first) !== getCardColor(target) &&
    first.rank === target.rank - 1
  );
}

/**
 * Test if a card can be placed on a foundation pile.
 * @param {Card} card Card to place.
 * @param {Card[]} foundation Foundation pile.
 * @returns {boolean} True if valid.
 */
export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) return card.rank === 1;
  const top = foundation[foundation.length - 1];
  return top.suit === card.suit && card.rank === top.rank + 1;
}

/**
 * Draw cards from stock to waste (or redeal when empty).
 * @param {GameState} state Current state.
 * @returns {GameState} Next state.
 */
export function drawFromStock(state: GameState): GameState {
  if (state.held) {
    return { ...state, message: "Place held cards first." };
  }
  if (state.stock.length === 0) {
    if (state.waste.length === 0)
      return { ...state, message: "Stock is empty." };
    const resetStock = state.waste
      .slice()
      .reverse()
      .map((card) => ({ ...card, faceUp: false }));
    return normalizeState({
      ...state,
      stock: resetStock,
      waste: [],
      redeals: state.redeals + 1,
      moves: state.moves + 1,
      message: "",
    });
  }

  const count = Math.min(state.drawCount, state.stock.length);
  const stock = state.stock.slice();
  const waste = state.waste.slice();
  for (let i = 0; i < count; i += 1) {
    const card = stock.pop();
    if (!card) break;
    waste.push({ ...card, faceUp: true });
  }

  return normalizeState({
    ...state,
    stock,
    waste,
    moves: state.moves + 1,
    message: "",
  });
}

/**
 * Get cards currently held (selected).
 * @param {GameState} state Current state.
 * @returns {Card[]} Held cards.
 */
export function getHeldCards(state: GameState): Card[] {
  if (!state.held) return [];
  const source = state.held.source;
  if (source.area === "tableau") {
    const column = state.tableau[source.col] ?? [];
    return column.slice(source.depth);
  }
  if (source.area === "waste") {
    const card = state.waste[state.waste.length - 1];
    return card ? [card] : [];
  }
  const pile = state.foundations[source.suit];
  const card = pile[pile.length - 1];
  return card ? [card] : [];
}

/**
 * Remove held cards from their source pile.
 * @param {GameState} state Current state.
 * @returns {GameState} Next state.
 */
export function removeHeldCards(state: GameState): GameState {
  if (!state.held) return state;
  const source = state.held.source;
  if (source.area === "tableau") {
    const tableau = state.tableau.map((column, col) => {
      if (col !== source.col) return column.slice();
      const remaining = column.slice(0, source.depth);
      if (remaining.length > 0) {
        const top = remaining[remaining.length - 1];
        if (!top.faceUp) {
          remaining[remaining.length - 1] = { ...top, faceUp: true };
        }
      }
      return remaining;
    });
    return { ...state, tableau };
  }
  if (source.area === "waste") {
    return { ...state, waste: state.waste.slice(0, -1) };
  }
  if (source.area === "foundation") {
    const foundations = {
      ...state.foundations,
      [source.suit]: state.foundations[source.suit].slice(0, -1),
    };
    return { ...state, foundations };
  }
  return state;
}

/**
 * Begin holding cards based on the cursor position.
 * @param {GameState} state Current state.
 * @returns {GameState} Next state.
 */
export function pickUpAtCursor(state: GameState): GameState {
  if (state.held) return state;
  if (state.cursor.zone === "top") {
    const slot = getTopSlots()[state.cursor.index];
    if (slot.kind === "waste") {
      if (state.waste.length === 0)
        return { ...state, message: "Waste is empty." };
      return {
        ...state,
        held: { source: { area: "waste" }, count: 1 },
        message: "",
      };
    }
    if (slot.kind === "foundation" && slot.suit) {
      const pile = state.foundations[slot.suit];
      if (pile.length === 0)
        return { ...state, message: "Foundation is empty." };
      return {
        ...state,
        held: { source: { area: "foundation", suit: slot.suit }, count: 1 },
        message: "",
      };
    }
    return state;
  }

  if (state.cursor.zone === "tableau") {
    const column = state.tableau[state.cursor.col] ?? [];
    if (column.length === 0) return state;
    const card = column[state.cursor.depth];
    if (!card || !card.faceUp)
      return { ...state, message: "That card is face down." };
    const count = column.length - state.cursor.depth;
    return {
      ...state,
      held: {
        source: {
          area: "tableau",
          col: state.cursor.col,
          depth: state.cursor.depth,
        },
        count,
      },
      message: "",
    };
  }

  return state;
}

/**
 * Cancel the held selection.
 * @param {GameState} state Current state.
 * @returns {GameState} Next state.
 */
export function cancelHeld(state: GameState): GameState {
  if (!state.held) return state;
  return { ...state, held: null, message: "" };
}

/**
 * Drop held cards onto the cursor target.
 * @param {GameState} state Current state.
 * @returns {GameState} Next state.
 */
export function dropHeld(state: GameState): GameState {
  if (!state.held) return state;
  const cards = getHeldCards(state);
  if (cards.length === 0)
    return { ...state, held: null, message: "Nothing to move." };
  if (state.cursor.zone === "top") {
    const slot = getTopSlots()[state.cursor.index];
    if (slot.kind === "foundation" && slot.suit && cards.length === 1) {
      const pile = state.foundations[slot.suit];
      if (canPlaceOnFoundation(cards[0], pile)) {
        const removed = removeHeldCards(state);
        const foundations = {
          ...removed.foundations,
          [slot.suit]: pile.concat(cards[0]),
        };
        return normalizeState({
          ...removed,
          foundations,
          held: null,
          moves: removed.moves + 1,
          message: "",
        });
      }
      return { ...state, held: null, message: "Cannot place on foundation." };
    }
    return { ...state, held: null, message: "Invalid target." };
  }

  if (state.cursor.zone === "tableau") {
    const column = state.tableau[state.cursor.col] ?? [];
    if (canPlaceOnTableau(cards, column)) {
      const removed = removeHeldCards(state);
      const targetCol = state.cursor.col;
      const tableau = removed.tableau.map((col, index) =>
        index === targetCol ? col.concat(cards) : col,
      );
      return normalizeState({
        ...removed,
        tableau,
        held: null,
        moves: removed.moves + 1,
        message: "",
      });
    }
    return { ...state, held: null, message: "Cannot place on tableau." };
  }

  return { ...state, held: null, message: "Invalid target." };
}

/**
 * Attempt to auto-move a card to its foundation.
 * @param {GameState} state Current state.
 * @returns {GameState} Next state.
 */
export function autoMove(state: GameState): GameState {
  if (state.held) {
    const cards = getHeldCards(state);
    if (cards.length !== 1)
      return { ...state, message: "Only single cards can auto-move." };
    const card = cards[0];
    const foundation = state.foundations[card.suit];
    if (!canPlaceOnFoundation(card, foundation)) {
      return { ...state, message: "Cannot auto-move." };
    }
    const removed = removeHeldCards(state);
    const foundations = {
      ...removed.foundations,
      [card.suit]: foundation.concat(card),
    };
    return normalizeState({
      ...removed,
      foundations,
      held: null,
      moves: removed.moves + 1,
      message: "",
    });
  }

  if (state.cursor.zone === "top") {
    const slot = getTopSlots()[state.cursor.index];
    if (slot.kind === "waste") {
      const card = state.waste[state.waste.length - 1];
      if (!card) return { ...state, message: "Waste is empty." };
      const foundation = state.foundations[card.suit];
      if (!canPlaceOnFoundation(card, foundation))
        return { ...state, message: "Cannot auto-move." };
      const foundations = {
        ...state.foundations,
        [card.suit]: foundation.concat(card),
      };
      return normalizeState({
        ...state,
        waste: state.waste.slice(0, -1),
        foundations,
        moves: state.moves + 1,
        message: "",
      });
    }
    return state;
  }

  if (state.cursor.zone === "tableau") {
    const column = state.tableau[state.cursor.col] ?? [];
    const card = column[column.length - 1];
    if (!card || !card.faceUp) return { ...state, message: "No movable card." };
    if (state.cursor.depth !== column.length - 1)
      return { ...state, message: "Only top card can auto-move." };
    const foundation = state.foundations[card.suit];
    if (!canPlaceOnFoundation(card, foundation))
      return { ...state, message: "Cannot auto-move." };
    const targetCol = state.cursor.col;
    const tableau = state.tableau.map((col, index) => {
      if (index !== targetCol) return col.slice();
      const next = col.slice(0, -1);
      if (next.length > 0 && !next[next.length - 1].faceUp) {
        const top = next[next.length - 1];
        next[next.length - 1] = { ...top, faceUp: true };
      }
      return next;
    });
    const foundations = {
      ...state.foundations,
      [card.suit]: foundation.concat(card),
    };
    return normalizeState({
      ...state,
      tableau,
      foundations,
      moves: state.moves + 1,
      message: "",
    });
  }

  return state;
}

/**
 * Handle the Enter action (pick up, drop, or draw).
 * @param {GameState} state Current state.
 * @returns {GameState} Next state.
 */
export function handleEnter(state: GameState): GameState {
  if (state.held) return dropHeld(state);
  if (state.cursor.zone === "top") {
    const slot = getTopSlots()[state.cursor.index];
    if (slot.kind === "stock") return drawFromStock(state);
  }
  return pickUpAtCursor(state);
}

/**
 * Check if the game is won (all cards in foundations).
 * @param {GameState} state Current state.
 * @returns {boolean} True if won.
 */
export function isWin(state: GameState): boolean {
  const total = SUITS.reduce(
    (sum, suit) => sum + state.foundations[suit].length,
    0,
  );
  return total === 52;
}
