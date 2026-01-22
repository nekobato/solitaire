/**
 * Rendering helpers for the Blessed UI.
 * @module render
 */

"use strict";

import {
  Card,
  FreeCellState,
  GameKind,
  GameState,
  KlondikeState,
  getCardColor,
  Suit,
} from "./game";
import { resolveTheme, Style, Theme } from "./theme";

const SUIT_SYMBOL: Record<Suit, string> = { S: "♠", H: "♥", C: "♣", D: "♦" };
const COMPACT_CELL_WIDTH = 5;
const RICH_CARD_WIDTH = 7;
const RICH_CARD_HEIGHT = 5;
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

function freecellLabel(index: number): string {
  return `F${index + 1}`;
}

/**
 * Wrap text with blessed color tags.
 * @param {string} text Text content.
 * @param {{ fg?: string; bold?: boolean }} style Style info.
 * @param {boolean} enabled Whether tags are enabled.
 * @returns {string} Tagged text.
 */
function applyStyle(
  text: string,
  style: { fg?: string; bold?: boolean },
  enabled: boolean,
): string {
  if (!enabled) return text;
  const parts: string[] = [];
  if (style.fg) parts.push(`{${style.fg}-fg}`);
  if (style.bold) parts.push("{bold}");
  parts.push(text);
  if (style.bold) parts.push("{/bold}");
  if (style.fg) parts.push(`{/${style.fg}-fg}`);
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
function getSuitDisplayColor(suit: Suit, theme: Theme): string {
  return suit === "H" || suit === "D"
    ? theme.foundationPlaceholder.redFg
    : theme.foundationPlaceholder.blackFg;
}

/**
 * Merge a base style with overrides.
 * @param {Style} base Base style.
 * @param {Style} override Override style.
 * @returns {Style} Merged style.
 */
function mergeStyle(base: Style, override: Style): Style {
  return {
    fg: override.fg ?? base.fg,
    bold: override.bold ?? base.bold,
  };
}

/**
 * Apply styles to segments and join them.
 * @param {{ text: string; style: Style }[]} segments Segments to style.
 * @param {boolean} enabled Whether tags are enabled.
 * @returns {string} Styled string.
 */
function applySegments(
  segments: { text: string; style: Style }[],
  enabled: boolean,
): string {
  return segments
    .map((segment) => applyStyle(segment.text, segment.style, enabled))
    .join("");
}

/**
 * Frame rich card content lines with a box border.
 * @param {string[]} innerLines Inner content lines.
 * @param {Style} borderStyle Border style.
 * @param {Style} contentStyle Content style.
 * @param {boolean} useColor Whether tags are enabled.
 * @returns {string[]} Card lines.
 */
function frameRichCard(
  innerLines: string[],
  borderStyle: Style,
  contentStyle: Style,
  useColor: boolean,
  borderLabel?: string,
): string[] {
  const content = innerLines
    .slice(0, RICH_CARD_HEIGHT - 2)
    .map((line) => padRight(line, RICH_INNER_WIDTH));
  while (content.length < RICH_CARD_HEIGHT - 2) {
    content.push(" ".repeat(RICH_INNER_WIDTH));
  }
  const safeLabel = borderLabel ? borderLabel.slice(0, RICH_INNER_WIDTH) : "";
  const hasLabel = safeLabel.length > 0;

  const buildBorderLine = (
    leftChar: string,
    rightChar: string,
    labelAtEnd: boolean,
  ): string => {
    if (!hasLabel) {
      return applyStyle(
        `${leftChar}${"─".repeat(RICH_INNER_WIDTH)}${rightChar}`,
        borderStyle,
        useColor,
      );
    }
    const maxLeft = RICH_INNER_WIDTH - safeLabel.length;
    const leftDashCount = labelAtEnd ? maxLeft : 0;
    const rightDashCount = Math.max(
      0,
      RICH_INNER_WIDTH - leftDashCount - safeLabel.length,
    );
    return applySegments(
      [
        { text: leftChar, style: borderStyle },
        { text: "─".repeat(leftDashCount), style: borderStyle },
        { text: safeLabel, style: contentStyle },
        { text: "─".repeat(rightDashCount), style: borderStyle },
        { text: rightChar, style: borderStyle },
      ],
      useColor,
    );
  };

  const top = buildBorderLine("╭", "╮", false);
  const bottom = buildBorderLine("╰", "╯", true);
  return [
    top,
    ...content.map((line) =>
      applySegments(
        [
          { text: "│", style: borderStyle },
          { text: line, style: contentStyle },
          { text: "│", style: borderStyle },
        ],
        useColor,
      ),
    ),
    bottom,
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
  placeholderStyle?: Style;
  useColor: boolean;
  theme: Theme;
}): string[] {
  const {
    card,
    isCursor,
    isSelected,
    placeholder,
    useColor,
    placeholderStyle,
    theme,
  } = params;
  let contentStyle: Style = { fg: theme.card.placeholder.fg };
  let lines: string[] = [];
  let borderLabel: string | undefined;

  if (card) {
    if (card.faceUp) {
      const suit = SUIT_SYMBOL[card.suit];
      const rank = rankToString(card.rank);
      borderLabel = `${rank}${suit}`;
      lines = Array(RICH_CARD_HEIGHT - 2).fill(" ".repeat(RICH_INNER_WIDTH));
      contentStyle = {
        fg:
          getCardColor(card) === "red"
            ? theme.card.face.redFg
            : theme.card.face.blackFg,
        bold: true,
      };
    } else {
      const fill = CARD_BACK_PATTERN.repeat(RICH_INNER_WIDTH);
      lines = Array(RICH_CARD_HEIGHT - 2).fill(fill);
      contentStyle = { fg: theme.card.back.fg };
    }
  } else {
    const blank = " ".repeat(RICH_INNER_WIDTH);
    lines = Array(RICH_CARD_HEIGHT - 2).fill(blank);
    if (placeholder) {
      lines[1] = centerText(placeholder, RICH_INNER_WIDTH);
    }
    if (placeholderStyle?.fg) contentStyle = { fg: placeholderStyle.fg };
  }

  const baseBorder = theme.card.border;
  let borderStyle = baseBorder;
  let textStyle = contentStyle;

  if (isCursor && isSelected) {
    borderStyle = mergeStyle(baseBorder, theme.highlight.cursorSelected.border);
    textStyle = mergeStyle(contentStyle, theme.highlight.cursorSelected.text);
  } else if (isCursor) {
    borderStyle = mergeStyle(baseBorder, theme.highlight.cursor.border);
    textStyle = mergeStyle(contentStyle, theme.highlight.cursor.text);
  } else if (isSelected) {
    borderStyle = mergeStyle(baseBorder, theme.highlight.selected.border);
    textStyle = mergeStyle(contentStyle, theme.highlight.selected.text);
  }

  return frameRichCard(lines, borderStyle, textStyle, useColor, borderLabel);
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
  placeholderStyle?: Style;
  useColor: boolean;
  theme: Theme;
}): string {
  const {
    card,
    isCursor,
    isSelected,
    placeholder,
    useColor,
    placeholderStyle,
  } = params;
  let label = placeholder;
  let contentStyle: Style = { fg: params.theme.card.placeholder.fg };

  if (card) {
    if (card.faceUp) {
      const suit = SUIT_SYMBOL[card.suit];
      const rank = rankToString(card.rank);
      label = `${rank}${suit}`.padStart(3, " ");
      contentStyle = {
        fg:
          getCardColor(card) === "red"
            ? params.theme.card.face.redFg
            : params.theme.card.face.blackFg,
      };
    } else {
      label = "##".padStart(3, " ");
      contentStyle = { fg: params.theme.card.back.fg };
    }
  } else {
    if (placeholderStyle?.fg) contentStyle = { fg: placeholderStyle.fg };
  }

  const baseBorder = params.theme.card.border;
  let borderStyle = baseBorder;
  let textStyle = contentStyle;

  if (isCursor && isSelected) {
    borderStyle = mergeStyle(
      baseBorder,
      params.theme.highlight.cursorSelected.border,
    );
    textStyle = mergeStyle(
      contentStyle,
      params.theme.highlight.cursorSelected.text,
    );
  } else if (isCursor) {
    borderStyle = mergeStyle(baseBorder, params.theme.highlight.cursor.border);
    textStyle = mergeStyle(contentStyle, params.theme.highlight.cursor.text);
  } else if (isSelected) {
    borderStyle = mergeStyle(
      baseBorder,
      params.theme.highlight.selected.border,
    );
    textStyle = mergeStyle(contentStyle, params.theme.highlight.selected.text);
  }

  return applySegments(
    [
      { text: "[", style: borderStyle },
      { text: label, style: textStyle },
      { text: "]", style: borderStyle },
    ],
    useColor,
  );
}

/**
 * Build the top row slots for stock, waste, and foundations.
 * @param {GameState} state Current state.
 * @param {boolean} useColor Color flag.
 * @returns {string} Rendered row.
 */
function renderCompactTopRow(
  state: KlondikeState,
  useColor: boolean,
  theme: Theme,
): string {
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
    let placeholderStyle: Style | undefined;

    if (slot.kind === "stock") {
      card =
        state.stock.length > 0 ? state.stock[state.stock.length - 1] : null;
      placeholder = "###";
      placeholderStyle = theme.card.placeholder;
    }
    if (slot.kind === "waste") {
      card =
        state.waste.length > 0 ? state.waste[state.waste.length - 1] : null;
    }
    if (slot.kind === "foundation" && slot.suit) {
      const pile = state.foundations[slot.suit];
      card = pile.length > 0 ? pile[pile.length - 1] : null;
      if (!card) {
        placeholder = ` ${SUIT_SYMBOL[slot.suit]} `;
        placeholderStyle = { fg: getSuitDisplayColor(slot.suit, theme) };
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

    return formatCompactCardCell({
      card,
      isCursor,
      isSelected,
      placeholder,
      placeholderStyle,
      useColor,
      theme,
    });
  });

  const gap = " ".repeat(COMPACT_CELL_WIDTH + 2);
  return `${cells.slice(0, 2).join(" ")}${gap}${cells.slice(2).join(" ")}`;
}

function renderCompactTopRowFreeCell(
  state: FreeCellState,
  useColor: boolean,
  theme: Theme,
): string {
  const slots: {
    kind: "freecell" | "foundation";
    suit?: Suit;
    index?: number;
  }[] = [
    { kind: "freecell", index: 0 },
    { kind: "freecell", index: 1 },
    { kind: "freecell", index: 2 },
    { kind: "freecell", index: 3 },
    { kind: "foundation", suit: "S" },
    { kind: "foundation", suit: "H" },
    { kind: "foundation", suit: "C" },
    { kind: "foundation", suit: "D" },
  ];

  const cells = slots.map((slot, index) => {
    let card: Card | null = null;
    let placeholder = "   ";
    let placeholderStyle: Style | undefined;

    if (slot.kind === "freecell") {
      const cellIndex = slot.index ?? 0;
      card = state.freecells[cellIndex] ?? null;
      placeholder = padRight(freecellLabel(cellIndex), 3);
      placeholderStyle = theme.card.placeholder;
    }
    if (slot.kind === "foundation" && slot.suit) {
      const pile = state.foundations[slot.suit];
      card = pile.length > 0 ? pile[pile.length - 1] : null;
      if (!card) {
        placeholder = ` ${SUIT_SYMBOL[slot.suit]} `;
        placeholderStyle = { fg: getSuitDisplayColor(slot.suit, theme) };
      }
    }

    const isCursor =
      state.cursor.zone === "top" && state.cursor.index === index;
    const isSelected = Boolean(
      state.held &&
      ((state.held.source.area === "freecell" &&
        slot.kind === "freecell" &&
        state.held.source.index === slot.index) ||
        (state.held.source.area === "foundation" &&
          slot.kind === "foundation" &&
          state.held.source.suit === slot.suit)),
    );

    return formatCompactCardCell({
      card,
      isCursor,
      isSelected,
      placeholder,
      placeholderStyle,
      useColor,
      theme,
    });
  });

  return cells.join(" ");
}

/**
 * Build the tableau area.
 * @param {GameState} state Current state.
 * @param {boolean} useColor Color flag.
 * @returns {string[]} Rendered lines.
 */
function renderCompactTableau(
  state: GameState,
  useColor: boolean,
  theme: Theme,
): string[] {
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
          theme,
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
function renderRichTopRow(
  state: KlondikeState,
  useColor: boolean,
  theme: Theme,
): string[] {
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
    let placeholderStyle: Style | undefined;

    if (slot.kind === "stock") {
      card =
        state.stock.length > 0 ? state.stock[state.stock.length - 1] : null;
      if (!card) {
        placeholder = "###";
        placeholderStyle = theme.card.placeholder;
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
        placeholderStyle = { fg: getSuitDisplayColor(slot.suit, theme) };
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
      placeholderStyle,
      useColor,
      theme,
    });
  });

  const leftLines = joinCardLineGroups(cards.slice(0, 2), " ", RICH_CARD_WIDTH);
  const rightLines = joinCardLineGroups(cards.slice(2), " ", RICH_CARD_WIDTH);
  const gap = " ".repeat(RICH_CARD_WIDTH + 2);
  return leftLines.map((line, index) => `${line}${gap}${rightLines[index]}`);
}

function renderRichTopRowFreeCell(
  state: FreeCellState,
  useColor: boolean,
  theme: Theme,
): string[] {
  const slots: {
    kind: "freecell" | "foundation";
    suit?: Suit;
    index?: number;
  }[] = [
    { kind: "freecell", index: 0 },
    { kind: "freecell", index: 1 },
    { kind: "freecell", index: 2 },
    { kind: "freecell", index: 3 },
    { kind: "foundation", suit: "S" },
    { kind: "foundation", suit: "H" },
    { kind: "foundation", suit: "C" },
    { kind: "foundation", suit: "D" },
  ];

  const cards = slots.map((slot, index) => {
    let card: Card | null = null;
    let placeholder = "";
    let placeholderStyle: Style | undefined;

    if (slot.kind === "freecell") {
      const cellIndex = slot.index ?? 0;
      card = state.freecells[cellIndex] ?? null;
      placeholder = freecellLabel(cellIndex);
      placeholderStyle = theme.card.placeholder;
    }
    if (slot.kind === "foundation" && slot.suit) {
      const pile = state.foundations[slot.suit];
      card = pile.length > 0 ? pile[pile.length - 1] : null;
      if (!card) {
        placeholder = SUIT_SYMBOL[slot.suit];
        placeholderStyle = { fg: getSuitDisplayColor(slot.suit, theme) };
      }
    }

    const isCursor =
      state.cursor.zone === "top" && state.cursor.index === index;
    const isSelected = Boolean(
      state.held &&
      ((state.held.source.area === "freecell" &&
        slot.kind === "freecell" &&
        state.held.source.index === slot.index) ||
        (state.held.source.area === "foundation" &&
          slot.kind === "foundation" &&
          state.held.source.suit === slot.suit)),
    );

    return formatRichCardLines({
      card,
      isCursor,
      isSelected,
      placeholder,
      placeholderStyle,
      useColor,
      theme,
    });
  });

  return joinCardLineGroups(cards, " ", RICH_CARD_WIDTH);
}

/**
 * Build the tableau area (rich mode).
 * @param {GameState} state Current state.
 * @param {boolean} useColor Color flag.
 * @returns {string[]} Rendered lines.
 */
function renderRichTableau(
  state: GameState,
  useColor: boolean,
  theme: Theme,
): string[] {
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
        theme,
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
        theme,
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
  options: { useColor?: boolean; compact?: boolean; theme?: Theme } = {},
): string {
  const useColor = options.useColor !== false;
  const theme = options.theme ?? resolveTheme();
  const lines: string[] = [];
  const compact = options.compact === true;
  if (compact) {
    if (state.kind === "freecell") {
      lines.push(renderCompactTopRowFreeCell(state, useColor, theme));
    } else {
      lines.push(renderCompactTopRow(state, useColor, theme));
    }
  } else {
    if (state.kind === "freecell") {
      lines.push(...renderRichTopRowFreeCell(state, useColor, theme));
    } else {
      lines.push(...renderRichTopRow(state, useColor, theme));
    }
  }
  lines.push("");
  if (compact) {
    lines.push(...renderCompactTableau(state, useColor, theme));
  } else {
    lines.push(...renderRichTableau(state, useColor, theme));
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
  if (state.kind === "freecell") {
    const emptyFreecells = state.freecells.filter((card) => !card).length;
    return [
      `FreeCells: ${emptyFreecells}/${state.freecells.length}`,
      `Moves: ${state.moves}`,
      `Time: ${minutes}:${seconds}`,
      state.message ? `Note: ${state.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const mode = state.drawCount === 1 ? "easy (draw 1)" : "standard (draw 3)";
  const tableauCount = state.tableau.reduce(
    (sum, column) => sum + column.length,
    0,
  );
  const foundationCount = Object.values(state.foundations).reduce(
    (sum, pile) => sum + pile.length,
    0,
  );
  const wasteCount = state.waste.length;
  const boardCount = tableauCount + foundationCount + wasteCount;
  return [
    `Mode: ${mode}`,
    `Board: ${boardCount}`,
    `Stock: ${state.stock.length}`,
    `Moves: ${state.moves}`,
    `Redeals: ${state.redeals}`,
    `Time: ${minutes}:${seconds}`,
    state.message ? `Note: ${state.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Render the help panel.
 * @returns {string} Help text.
 */
export function renderHelp(kind: GameKind = "klondike"): string {
  if (kind === "freecell") {
    return [
      "Arrows/WASD: move  Enter: pick/drop  Space: auto-move  Esc: cancel  Q: quit",
    ].join("\n");
  }
  return [
    "Arrows/WASD: move  Enter: pick/drop/draw  Space: auto-move  Esc: cancel  Q: quit",
  ].join("\n");
}
