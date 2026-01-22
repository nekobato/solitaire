/**
 * CLI smoke test.
 * @module test-cli
 */

"use strict";

import test = require("node:test");
import assert = require("node:assert/strict");
import { spawnSync } from "node:child_process";
import * as path from "node:path";

test("CLI smoke test", () => {
  const cliPath = path.join(__dirname, "..", "solitaire.ts");
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", cliPath, "--smoke"],
    {
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /SMOKE_OK/);
});

test("CLI smoke test (freecell)", () => {
  const cliPath = path.join(__dirname, "..", "solitaire.ts");
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", cliPath, "--smoke", "--game", "freecell"],
    {
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /SMOKE_OK/);
});
