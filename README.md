# @nekobato/solitaire

[日本語版 README](README.ja.md)

A CLI solitaire you can play in the terminal. Supports Klondike and FreeCell.

```sh
# Klondike
npx @nekobato/solitaire
```

```sh
# FreeCell
npx @nekobato/solitaire --game freecell
```

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
npm install
npm run start
```

### Options

Use `--help` to see the latest option list and available themes.

```sh
npx @nekobato/solitaire --help
```

| Option                        | Description                                |
| ----------------------------- | ------------------------------------------ |
| `--game <klondike\|freecell>` | Select game (default: klondike)            |
| `--easy`                      | Draw 1 card from stock (Klondike only)     |
| `--draw <1\|3>`               | Draw count (Klondike only, default: 3)     |
| `--seed <number>`             | Deterministic shuffle seed                 |
| `--no-color`                  | Disable ANSI colors                        |
| `--compact`                   | Use compact card rendering                 |
| `--theme <name>`              | Select color theme (see `--help` for list) |
| `--help, -h`                  | Show help                                  |
| `--version, -v`               | Print version                              |
| `--smoke`                     | Run a smoke test and exit                  |

### Examples

```sh
# Start FreeCell
npx @nekobato/solitaire --game freecell

# Start Klondike with a fixed seed and draw 1
npx @nekobato/solitaire --seed 42 --draw 1
```

## Contributing

1. Fork the repository and create a feature branch
2. Install dependencies
3. Make changes, then run formatting and tests

```sh
npm install
npm run format
npm run test
```

## License

MIT License
