# @nekobato/solitaire

ターミナルで遊べる TUI ソリティアです。クロンダイクとフリーセルに対応しています。

## 概要

- Node.js >= 18 が必要です
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
npm install
npm run start
```

### オプション

`--help` で最新のオプション一覧とテーマ名を確認できます。

```sh
npx @nekobato/solitaire --help
```

| オプション                    | 説明                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `--game <klondike\|freecell>` | ゲーム種別を選択します（既定: klondike）             |
| `--easy`                      | 山札から 1 枚引きにします（klondike のみ）           |
| `--draw <1\|3>`               | 山札からの枚数を指定します（klondike のみ、既定: 3） |
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

# シードを固定してクロンダイクを 1 枚引きで起動
npx @nekobato/solitaire --seed 42 --draw 1
```

## コントリビュートの仕方

1. リポジトリを fork してブランチを作成します
2. 依存関係をインストールします
3. 変更を加え、整形とテストを実行します

```sh
npm install
npm run format
npm run test
```

## ライセンス

MIT License
