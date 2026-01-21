/**
 * Rendering helpers for the Blessed UI.
 * @module render
 */

"use strict";

import { Card, GameState, getCardColor, Suit } from "./game";

const SUIT_SYMBOL: Record<Suit, string> = { S: "♠", H: "♥", C: "♣", D: "♦" };
const COMPACT_CELL_WIDTH = 5;
const RICH_CARD_WIDTH = 8;
const RICH_CARD_HEIGHT = 6;
const RICH_INNER_WIDTH = RICH_CARD_WIDTH - 2;
const RICH_TABLEAU_OVERLAP = 1;
const CARD_BACK_PATTERN = "░";

/**
 * Convert a rank number to label.
 * @param {number} rank Rank value.
 * @returns {string} Rank label.
 */
export function rankToString(rank: number): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

/**
 * Wrap text with blessed color tags.
 * @param {string} text Text content.
 * @param {{ fg?: string; bg?: string; bold?: boolean }} style Style info.
 * @param {boolean} enabled Whether tags are enabled.
 * @returns {string} Tagged text.
 */
function applyStyle(
  text: string,
  style: { fg?: string; bg?: string; bold?: boolean },
  enabled: boolean,
): string {
  if (!enabled) return text;
  const parts: string[] = [];
  if (style.bg) parts.push(`{${style.bg}-bg}`);
  if (style.fg) parts.push(`{${style.fg}-fg}`);
  if (style.bold) parts.push("{bold}");
  parts.push(text);
  if (style.bold) parts.push("{/bold}");
  if (style.fg) parts.push(`{/${style.fg}-fg}`);
  if (style.bg) parts.push(`{/${style.bg}-bg}`);
  return parts.join("");
}

/**
 * Pad text on the right to a fixed width.
 * @param {string} text Text to pad.
 * @param {number} width Target width.
 * @returns {string} Padded text.
 */
function padRight(text: string, width: number): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return clipped + " ".repeat(width - clipped.length);
}

/**
 * Pad text on the left to a fixed width.
 * @param {string} text Text to pad.
 * @param {number} width Target width.
 * @returns {string} Padded text.
 */
function padLeft(text: string, width: number): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return " ".repeat(width - clipped.length) + clipped;
}

/**
 * Center text within a fixed width.
 * @param {string} text Text to center.
 * @param {number} width Target width.
 * @returns {string} Centered text.
 */
function centerText(text: string, width: number): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  const left = Math.floor((width - clipped.length) / 2);
  const right = width - clipped.length - left;
  return `${" ".repeat(left)}${clipped}${" ".repeat(right)}`;
}

/**
 * Resolve suit display color.
 * @param {Suit} suit Suit value.
 * @returns {string} Color label.
 */
function getSuitDisplayColor(suit: Suit): string {
  return suit === "H" || suit === "D" ? "red" : "white";
}

/**
 * Apply a style to multiple lines.
 * @param {string[]} lines Lines to style.
 * @param {{ fg?: string; bg?: string; bold?: boolean }} style Style info.
 * @param {boolean} enabled Whether tags are enabled.
 * @returns {string[]} Styled lines.
 */
function applyStyleToLines(
  lines: string[],
  style: { fg?: string; bg?: string; bold?: boolean },
  enabled: boolean,
): string[] {
  return lines.map((line) => applyStyle(line, style, enabled));
}

/**
 * Frame rich card content lines with a box border.
 * @param {string[]} innerLines Inner content lines.
 * @returns {string[]} Card lines.
 */
function frameRichCard(innerLines: string[]): string[] {
  const content = innerLines
    .slice(0, RICH_CARD_HEIGHT - 2)
    .map((line) => padRight(line, RICH_INNER_WIDTH));
  while (content.length < RICH_CARD_HEIGHT - 2) {
    content.push(" ".repeat(RICH_INNER_WIDTH));
  }
  return [
    `╭${"─".repeat(RICH_INNER_WIDTH)}╮`,
    ...content.map((line) => `│${line}│`),
    `╰${"─".repeat(RICH_INNER_WIDTH)}╯`,
  ];
}

/**
 * Format a rich card into fixed-width lines.
 * @param {object} params Rendering params.
 * @param {Card | null} params.card Card or null.
 * @param {boolean} params.isCursor Cursor flag.
 * @param {boolean} params.isSelected Selection flag.
 * @param {string} params.placeholder Placeholder label.
 * @param {string | undefined} params.placeholderColor Placeholder color.
 * @param {boolean} params.useColor Color flag.
 * @returns {string[]} Card lines.
 */
function formatRichCardLines(params: {
  card: Card | null;
  isCursor: boolean;
  isSelected: boolean;
  placeholder: string;
  placeholderColor?: string;
  useColor: boolean;
}): string[] {
  const {
    card,
    isCursor,
    isSelected,
    placeholder,
    placeholderColor,
    useColor,
  } = params;
  let fg = placeholderColor ?? "white";
  let lines: string[] = [];

  if (card) {
    if (card.faceUp) {
      const suit = SUIT_SYMBOL[card.suit];
      const rank = rankToString(card.rank);
      const innerLines = [
        padRight(rank, RICH_INNER_WIDTH),
        padRight(suit, RICH_INNER_WIDTH),
        padLeft(suit, RICH_INNER_WIDTH),
        padLeft(rank, RICH_INNER_WIDTH),
      ];
      lines = frameRichCard(innerLines);
      fg = getCardColor(card) === "red" ? "red" : "white";
    } else {
      const fill = CARD_BACK_PATTERN.repeat(RICH_INNER_WIDTH);
      const innerLines = Array(RICH_CARD_HEIGHT - 2).fill(fill);
      lines = frameRichCard(innerLines);
      fg = "gray";
    }
  } else {
    const blank = " ".repeat(RICH_INNER_WIDTH);
    const innerLines = Array(RICH_CARD_HEIGHT - 2).fill(blank);
    if (placeholder) {
      innerLines[1] = centerText(placeholder, RICH_INNER_WIDTH);
    }
    lines = frameRichCard(innerLines);
  }

  if (isCursor && isSelected) {
    return applyStyleToLines(
      lines,
      { fg: "black", bg: "cyan", bold: true },
      useColor,
    );
  }
  if (isCursor) {
    return applyStyleToLines(
      lines,
      { fg: "black", bg: "white", bold: true },
      useColor,
    );
  }
  if (isSelected) {
    return applyStyleToLines(lines, { fg, bg: "yellow", bold: true }, useColor);
  }

  return applyStyleToLines(lines, { fg }, useColor);
}

/**
 * Join card line groups with padding.
 * @param {string[][]} groups Card line groups.
 * @param {string} separator Separator between groups.
 * @param {number} width Card width.
 * @returns {string[]} Joined lines.
 */
function joinCardLineGroups(
  groups: string[][],
  separator: string,
  width: number,
): string[] {
  const height = Math.max(0, ...groups.map((group) => group.length));
  const blank = " ".repeat(width);
  const lines: string[] = [];
  for (let row = 0; row < height; row += 1) {
    lines.push(groups.map((group) => group[row] ?? blank).join(separator));
  }
  return lines;
}

/**
 * Format a card into a fixed-width cell.
 * @param {object} params Rendering params.
 * @param {Card | null} params.card Card or null.
 * @param {boolean} params.isCursor Cursor flag.
 * @param {boolean} params.isSelected Selection flag.
 * @param {string} params.placeholder Placeholder label.
 * @param {boolean} params.useColor Color flag.
 * @returns {string} Cell string.
 */
function formatCompactCardCell(params: {
  card: Card | null;
  isCursor: boolean;
  isSelected: boolean;
  placeholder: string;
  useColor: boolean;
}): string {
  const { card, isCursor, isSelected, placeholder, useColor } = params;
  let label = placeholder;
  let fg = "white";

  if (card) {
    if (card.faceUp) {
      const suit = SUIT_SYMBOL[card.suit];
      const rank = rankToString(card.rank);
      label = `${rank}${suit}`.padStart(3, " ");
      fg = getCardColor(card) === "red" ? "red" : "white";
    } else {
      label = "##".padStart(3, " ");
      fg = "gray";
    }
  }

  const cell = `[${label}]`;

  if (isCursor && isSelected) {
    return applyStyle(cell, { fg: "black", bg: "cyan", bold: true }, useColor);
  }
  if (isCursor) {
    return applyStyle(cell, { fg: "black", bg: "white", bold: true }, useColor);
  }
  if (isSelected) {
    return applyStyle(cell, { fg, bg: "yellow", bold: true }, useColor);
  }

  return applyStyle(cell, { fg }, useColor);
}

/**
 * Build the top row slots for stock, waste, and foundations.
 * @param {GameState} state Current state.
 * @param {boolean} useColor Color flag.
 * @returns {string} Rendered row.
 */
function renderCompactTopRow(state: GameState, useColor: boolean): string {
  const slots: { kind: "stock" | "waste" | "foundation"; suit?: Suit }[] = [
    { kind: "stock" },
    { kind: "waste" },
    { kind: "foundation", suit: "S" },
    { kind: "foundation", suit: "H" },
    { kind: "foundation", suit: "C" },
    { kind: "foundation", suit: "D" },
  ];

  const cells = slots.map((slot, index) => {
    let card: Card | null = null;
    let placeholder = "   ";

    if (slot.kind === "stock") {
      card =
        state.stock.length > 0 ? state.stock[state.stock.length - 1] : null;
      placeholder = "###";
    }
    if (slot.kind === "waste") {
      card =
        state.waste.length > 0 ? state.waste[state.waste.length - 1] : null;
    }
    if (slot.kind === "foundation" && slot.suit) {
      const pile = state.foundations[slot.suit];
      card = pile.length > 0 ? pile[pile.length - 1] : null;
      placeholder = ` ${SUIT_SYMBOL[slot.suit]} `;
    }

    const isCursor =
      state.cursor.zone === "top" && state.cursor.index === index;
    const isSelected = Boolean(
      state.held &&
      ((state.held.source.area === "waste" && slot.kind === "waste") ||
        (state.held.source.area === "foundation" &&
          slot.kind === "foundation" &&
          state.held.source.suit === slot.suit)),
    );

    return formatCompactCardCell({
      card,
      isCursor,
      isSelected,
      placeholder,
      useColor,
    });
  });

  const gap = " ".repeat(COMPACT_CELL_WIDTH + 2);
  return `${cells.slice(0, 2).join(" ")}${gap}${cells.slice(2).join(" ")}`;
}

/**
 * Build the tableau area.
 * @param {GameState} state Current state.
 * @param {boolean} useColor Color flag.
 * @returns {string[]} Rendered lines.
 */
function renderCompactTableau(state: GameState, useColor: boolean): string[] {
  const maxHeight = Math.max(1, ...state.tableau.map((col) => col.length));
  const lines: string[] = [];

  const header = state.tableau
    .map((_, idx) => {
      const label = String(idx + 1);
      const left = Math.floor((COMPACT_CELL_WIDTH - label.length) / 2);
      const right = COMPACT_CELL_WIDTH - label.length - left;
      return `${" ".repeat(left)}${label}${" ".repeat(right)}`;
    })
    .join(" ");
  lines.push(header);

  for (let row = 0; row < maxHeight; row += 1) {
    const line = state.tableau
      .map((column, colIndex) => {
        const card = column[row] ?? null;
        const isEmptyColumn = column.length === 0;
        const isBeyond = row >= column.length;
        const placeholder = "   ";
        const isCursor =
          state.cursor.zone === "tableau" &&
          state.cursor.col === colIndex &&
          state.cursor.depth === row;

        const isSelected = Boolean(
          state.held &&
          state.held.source.area === "tableau" &&
          state.held.source.col === colIndex &&
          row >= state.held.source.depth &&
          row < column.length,
        );

        if ((isBeyond && !isEmptyColumn) || (isEmptyColumn && row > 0)) {
          return " ".repeat(COMPACT_CELL_WIDTH);
        }

        return formatCompactCardCell({
          card,
          isCursor,
          isSelected,
          placeholder,
          useColor,
        });
      })
      .join(" ");
    lines.push(line);
  }

  return lines;
}

/**
 * Build the top row slots for stock, waste, and foundations (rich mode).
 * @param {GameState} state Current state.
 * @param {boolean} useColor Color flag.
 * @returns {string[]} Rendered lines.
 */
function renderRichTopRow(state: GameState, useColor: boolean): string[] {
  const slots: { kind: "stock" | "waste" | "foundation"; suit?: Suit }[] = [
    { kind: "stock" },
    { kind: "waste" },
    { kind: "foundation", suit: "S" },
    { kind: "foundation", suit: "H" },
    { kind: "foundation", suit: "C" },
    { kind: "foundation", suit: "D" },
  ];

  const cards = slots.map((slot, index) => {
    let card: Card | null = null;
    let placeholder = "";
    let placeholderColor: string | undefined;

    if (slot.kind === "stock") {
      card =
        state.stock.length > 0 ? state.stock[state.stock.length - 1] : null;
      if (!card) {
        placeholder = "###";
        placeholderColor = "gray";
      }
    }
    if (slot.kind === "waste") {
      card =
        state.waste.length > 0 ? state.waste[state.waste.length - 1] : null;
    }
    if (slot.kind === "foundation" && slot.suit) {
      const pile = state.foundations[slot.suit];
      card = pile.length > 0 ? pile[pile.length - 1] : null;
      if (!card) {
        placeholder = SUIT_SYMBOL[slot.suit];
        placeholderColor = getSuitDisplayColor(slot.suit);
      }
    }

    const isCursor =
      state.cursor.zone === "top" && state.cursor.index === index;
    const isSelected = Boolean(
      state.held &&
      ((state.held.source.area === "waste" && slot.kind === "waste") ||
        (state.held.source.area === "foundation" &&
          slot.kind === "foundation" &&
          state.held.source.suit === slot.suit)),
    );

    return formatRichCardLines({
      card,
      isCursor,
      isSelected,
      placeholder,
      placeholderColor,
      useColor,
    });
  });

  const leftLines = joinCardLineGroups(cards.slice(0, 2), " ", RICH_CARD_WIDTH);
  const rightLines = joinCardLineGroups(cards.slice(2), " ", RICH_CARD_WIDTH);
  const gap = " ".repeat(RICH_CARD_WIDTH + 2);
  return leftLines.map((line, index) => `${line}${gap}${rightLines[index]}`);
}

/**
 * Build the tableau area (rich mode).
 * @param {GameState} state Current state.
 * @param {boolean} useColor Color flag.
 * @returns {string[]} Rendered lines.
 */
function renderRichTableau(state: GameState, useColor: boolean): string[] {
  const columns = state.tableau.map((column, colIndex) => {
    if (column.length === 0) {
      const isCursor =
        state.cursor.zone === "tableau" &&
        state.cursor.col === colIndex &&
        state.cursor.depth === 0;
      return formatRichCardLines({
        card: null,
        isCursor,
        isSelected: false,
        placeholder: "",
        useColor,
      });
    }

    const lines: string[] = [];
    column.forEach((card, rowIndex) => {
      const isCursor =
        state.cursor.zone === "tableau" &&
        state.cursor.col === colIndex &&
        state.cursor.depth === rowIndex;
      const isSelected = Boolean(
        state.held &&
        state.held.source.area === "tableau" &&
        state.held.source.col === colIndex &&
        rowIndex >= state.held.source.depth &&
        rowIndex < column.length,
      );
      const cardLines = formatRichCardLines({
        card,
        isCursor,
        isSelected,
        placeholder: "",
        useColor,
      });
      if (rowIndex < column.length - 1) {
        lines.push(...cardLines.slice(0, RICH_TABLEAU_OVERLAP));
      } else {
        lines.push(...cardLines);
      }
    });
    return lines;
  });

  const header = state.tableau
    .map((_, idx) => centerText(String(idx + 1), RICH_CARD_WIDTH))
    .join(" ");
  const maxHeight = Math.max(1, ...columns.map((col) => col.length));
  const blank = " ".repeat(RICH_CARD_WIDTH);
  const lines: string[] = [header];

  for (let row = 0; row < maxHeight; row += 1) {
    const line = columns.map((col) => col[row] ?? blank).join(" ");
    lines.push(line);
  }

  return lines;
}

/**
 * Render the full board area.
 * @param {GameState} state Current state.
 * @param {{ useColor?: boolean; compact?: boolean }} options Rendering options.
 * @returns {string} Rendered board.
 */
export function renderBoard(
  state: GameState,
  options: { useColor?: boolean; compact?: boolean } = {},
): string {
  const useColor = options.useColor !== false;
  const lines: string[] = [];
  const compact = options.compact === true;
  if (compact) {
    lines.push(renderCompactTopRow(state, useColor));
  } else {
    lines.push(...renderRichTopRow(state, useColor));
  }
  lines.push("");
  if (compact) {
    lines.push(...renderCompactTableau(state, useColor));
  } else {
    lines.push(...renderRichTableau(state, useColor));
  }
  return lines.join("\n");
}

/**
 * Render the info panel.
 * @param {GameState} state Current state.
 * @returns {string} Info panel string.
 */
export function renderInfo(state: GameState): string {
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  const mode = state.drawCount === 1 ? "easy (draw 1)" : "standard (draw 3)";

  return [
    "Klondike Solitaire",
    `Mode: ${mode}`,
    `Moves: ${state.moves}`,
    `Redeals: ${state.redeals}`,
    `Time: ${minutes}:${seconds}`,
    state.won ? "Status: WIN" : "Status: playing",
    state.message ? `Note: ${state.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Render the help panel.
 * @returns {string} Help text.
 */
export function renderHelp(): string {
  return [
    "Arrows/WASD: move  Enter: pick/drop/draw  Space: auto-move  Esc: cancel  Q: quit",
    "Draw from Stock, move sequences on Tableau, build Foundations by suit.",
  ].join("\n");
}
