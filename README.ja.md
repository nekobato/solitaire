# @nekobato/solitaire

ターミナルで遊べる TUI ソリティアです。クロンダイクとフリーセルに対応しています。

```sh
# クロンダイク
npx @nekobato/solitaire
```

<img width="720" height="480" alt="klondike" src="https://github.com/user-attachments/assets/7273e012-fa36-4af6-a396-18b0efac0a34" />

```sh
# フリーセル
npx @nekobato/solitaire --game freecell
```

<img width="720" height="460" alt="freecell" src="https://github.com/user-attachments/assets/0f33987a-d4a1-4498-8465-42ecee4d6eb2" />

## 概要

- Node.js >= 22 が必要です
- 端末 UI は blessed を使用しています
- シード指定で同じシャッフルを再現できます
- 色テーマやコンパクト表示に対応しています

## 使い方

### 実行

```sh
npx @nekobato/solitaire
```

ローカルで実行する場合:

```sh
git clone https://github.com/nekobato/solitaire-cli.git
pnpm install
pnpm start
```

### コンパクトモード

オプション `--compact` を付けるとコンパクト表示になります。

<img width="720" height="460" alt="klondike_compact" src="https://github.com/user-attachments/assets/2a00f6da-65c2-4042-980a-e808f7c7357f" />
<img width="720" height="460" alt="freecell_compact" src="https://github.com/user-attachments/assets/6fb18d9a-43b6-4310-ac4d-f62a8bccdbe4" />

### オプション

`--help` で最新のオプション一覧とテーマ名を確認できます。

```sh
npx @nekobato/solitaire --help
```

| オプション                    | 説明                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `--game <klondike\|freecell>` | ゲーム種別を選択します（既定: klondike）             |
| `--draw <1\|3>`               | 山札からの枚数を指定します（klondike のみ、既定: 1） |
| `--seed <number>`             | シャッフルのシードを指定します                       |
| `--no-color`                  | ANSI カラーを無効化します                            |
| `--compact`                   | コンパクトなカード表示にします                       |
| `--theme <name>`              | 色テーマを指定します（`--help` に一覧を表示）        |
| `--help, -h`                  | ヘルプを表示します                                   |
| `--version, -v`               | バージョンを表示します                               |
| `--smoke`                     | 簡易スモークテストを実行して終了します               |

### 例

```sh
# フリーセルを起動
npx @nekobato/solitaire --game freecell

# シードを固定してクロンダイクを 3 枚引きで起動
npx @nekobato/solitaire --seed 42 --draw 3
```

## コントリビュートの仕方

1. リポジトリを fork してブランチを作成します
2. 依存関係をインストールします
3. 変更を加え、整形とテストを実行します

```sh
pnpm install
pnpm format
pnpm test
```

## ライセンス

MIT License
