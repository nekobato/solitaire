# AGENTS.md

## 目的

このリポジトリで作業する自動エージェント向けの最小ガイド。

## 概要

- CLI のクロンダイク・ソリティア。
- 言語: TypeScript。
- 実行環境: Node.js >= 18。
- 端末 UI: blessed。
- ビルド: tsc で dist/ に出力。
- エントリポイント: bin/solitaire.js（ソース: bin/solitaire.ts）。

## ディレクトリ

- src/ : ゲームロジック・描画・UI。
- bin/ : CLI エントリ。
- test/ : Node.js test runner 用テスト。
- dist/ : ビルド成果物。

## よく使うコマンド

```sh
npm run build
npm run start
npm run test
npm run format
npm run format:check
```

## 作業方針

- TypeScript は関数型寄りの実装を優先し、class は避ける。
- 変更後は `npm run test` と `npm run format` を実行する（lint は未定義）。
- dist/ は生成物のため直接編集しない。
- bin/ の .ts と .js の対応関係に注意する。
- 依存追加や削除を行った場合は package.json とロックファイルを更新する。

## テスト

- `npm run test` は `npm run build` を実行後、`dist/test/*.test.js` を Node.js test runner で実行する。
