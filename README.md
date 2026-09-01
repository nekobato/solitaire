# @nekobato/solitaire

[日本語版 README](README.ja.md)

A terminal UI (TUI) solitaire you can play in the terminal. Supports Klondike and FreeCell.

```sh
# Klondike
npx @nekobato/solitaire
```

<img width="720" height="480" alt="klondike" src="https://github.com/user-attachments/assets/7273e012-fa36-4af6-a396-18b0efac0a34" />

```sh
# FreeCell
npx @nekobato/solitaire --game freecell
```

<img width="720" height="460" alt="freecell" src="https://github.com/user-attachments/assets/0f33987a-d4a1-4498-8465-42ecee4d6eb2" />

## Overview

- Requires Node.js >= 18
- Terminal UI built with [blessed](https://github.com/chjj/blessed)
- Reproducible shuffles via seed
- Supports color themes and compact rendering

## Usage

### Play

```sh
npx @nekobato/solitaire
```

Run locally:

```sh
git clone https://github.com/nekobato/solitaire-cli.git
pnpm install
pnpm start
```

### Compact Mode

Add option `-compact` to play compact mode.

<img width="720" height="460" alt="klondike_compact" src="https://github.com/user-attachments/assets/2a00f6da-65c2-4042-980a-e808f7c7357f" />
<img width="720" height="460" alt="freecell_compact" src="https://github.com/user-attachments/assets/6fb18d9a-43b6-4310-ac4d-f62a8bccdbe4" />

### Options

Use `--help` to see the latest option list and available themes.

```sh
npx @nekobato/solitaire --help
```

| Option                        | Description                                 |
| ----------------------------- | ------------------------------------------- |
| `--game <klondike\|freecell>` | Select game (default: klondike)             |
| `--draw <1\|3>`               | Draw count (Klondike only, default: 1)      |
| `--seed <number>`             | Deterministic shuffle seed                  |
| `--no-color`                  | Disable ANSI colors                         |
| `--compact`                   | Use compact card rendering                  |
| `--theme <name>`              | Select color theme (to be listed by --help) |
| `--help, -h`                  | Show help                                   |
| `--version, -v`               | Print version                               |
| `--smoke`                     | Run a smoke test and exit (for development) |

### Examples

```sh
# Start Klondike with a fixed seed and draw 3
npx @nekobato/solitaire --seed 42 --draw 3
```

## Development

```sh
pnpm install
pnpm start
pnpm format
pnpm test
```

## License

MIT License
