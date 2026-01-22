/**
 * Theme resolution tests.
 * @module test-theme
 */

"use strict";

import test = require("node:test");
import assert = require("node:assert/strict");
import { DEFAULT_THEME_NAME, isThemeName, resolveTheme } from "../lib/theme";

test("resolveTheme falls back to the default theme", () => {
  const theme = resolveTheme("unknown");
  assert.equal(theme.name, DEFAULT_THEME_NAME);
});

test("resolveTheme returns a known theme", () => {
  const theme = resolveTheme("contrast");
  assert.equal(theme.name, "contrast");
});

test("isThemeName validates theme names", () => {
  assert.equal(isThemeName("classic"), true);
  assert.equal(isThemeName("unknown"), false);
});
