# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリでコード作業を行う際のガイダンスを提供します。

## プロジェクト概要

NoteSyncは、React、TypeScript、Lexicalエディターフレームワークで構築された、Git統合機能を持つMarkdownノート作成用のElectronデスクトップアプリケーションです。リッチテキスト編集、ファイル管理、バージョン管理、AI機能をサポートしています。

## 必須コマンド

### 開発

```bash
npm install          # 依存関係をインストールし、Gitフックを設定
npm start           # 開発モードでElectronアプリを起動
npm run test:watch  # 開発中にテストをウォッチモードで実行
```

### コード品質

```bash
npm run format      # Prettierでコードをフォーマット
npm run lint        # ESLintを実行
npm test           # 全テストを一度実行
```

### ビルド & 配布

```bash
npm run package    # インストーラーなしでパッケージ化されたアプリを作成
npm run make       # 配布可能ファイルを作成（DMG、EXEなど）
npm run publish    # S3に公開（.envファイルにAWS認証情報が必要）
```

## アーキテクチャ概要

### プロセスアーキテクチャ

- **メインプロセス** (`src/main/`): システム操作、ファイルI/O、Git操作、ネイティブダイアログを処理
- **レンダラープロセス** (`src/renderer/`): UIコンポーネントを持つReactアプリケーション
- **プリロードスクリプト** (`src/main/preload.ts`): メインとレンダラープロセス間のセキュアなブリッジ

### IPC通信パターン

レンダラーからメインへの全ての通信は、プリロードスクリプトの公開APIを通じて行われます：

- `window.app` - アプリケーション設定
- `window.dialog` - システムダイアログ
- `window.fs` - ファイルシステム操作
- `window.export` - エクスポート機能
- `window.git` - Git操作
- `window.ai` - AI統合

### 状態管理

- 最小限のグローバル状態（主にトースト通知）にJotaiを使用
- ほとんどの状態はコンポーネントローカル
- Git状態は`useGitControl`フックで管理
- ファイル状態はカスタムフック（`useFileLoader`、`useFileSave`）で管理

### エディターアーキテクチャ

- 広範なプラグインシステムを持つLexicalフレームワーク
- Markdown、コードハイライト、テーブル、インラインAIをサポート
- 双方向Markdown変換
- 自動保存と未保存変更の追跡

### 主要技術

- **Electron Forge**: ビルドとパッケージング
- **Vite**: 高速バンドリングとHMR
- **Vitest**: テストフレームワーク
- **Tailwind CSS + DaisyUI**: スタイリング
- **isomorphic-git**: Git操作
- **Lexical**: リッチテキストエディター

## 開発ワークフロー

1. **機能開発**

   - mainから機能ブランチを作成
   - コンポーネントは`src/renderer/components/[FeatureName]/`に配置
   - コンポーネントと並行してテストを追加（`*.test.tsx`）
   - DaisyUIの既存UIパターンを使用

2. **テスト**

   - VitestとReact Testing Libraryを使用してテストを作成
   - Electron APIのモックは`src/test/setup.ts`で事前設定済み
   - 開発中は`npm run test:watch`を実行

3. **プリコミット**

   - Huskyがステージされたファイルで自動的にPrettierを実行
   - コミット前にテストが通ることを確認
   - セマンティックコミットメッセージを使用（例: `feat:`, `fix:`, `docs:`, `chore:`, `test:`）

4. **ビルド**
   - プラットフォーム固有のビルドを作成するには`npm run make`を使用
   - ビルドは`forge.config.ts`で設定

## 重要なパターン

### カスタムフック

コードベースはロジックのカプセル化のためにカスタムフックを広範囲に使用：

- ファイル操作: `useFileLoader`、`useFileSave`
- Git操作: `useGitControl`
- UIフィードバック: `useToast`
- ショートカット: `useSaveShortcut`

### ファイルシステム操作

- 全てのファイル操作はPromiseベース
- 大きなファイルはチャンク読み込みを使用
- ファイル操作の進捗追跡が利用可能

### Git統合

- isomorphic-gitのステータスマトリックスパターンを使用
- リモート操作のトークンベース認証
- ファイルレベルのステージング/アンステージングサポート

### セキュリティ

- コンテキスト分離が有効
- レンダラーでのNode.jsへの直接アクセスなし
- IPCチャンネルは厳密に定義され型付けされている

## 特別な考慮事項

1. **日本語ローカライゼーション**: アプリは主に日本語です。テストの説明とUIテキストはこの慣例に従ってください。

2. **開発限定機能**: Stagewiseツールバーは開発モードでのみ読み込まれ、プロダクションビルドから除外されます。

3. **環境変数**: S3公開用のAWS認証情報は`.env`ファイルに記載してください（gitにコミットしない）。

4. **パフォーマンス**: 大きなファイルはストリーミングとチャンク読み込みで処理されます。エディターは長いドキュメントに仮想スクロールを使用します。

## コミットベストプラクティス

### コミットのルール

- **細かくコミット**: 1つの機能・修正ごとに1コミット
- **関係のない変更は含めない**: `git add .` ではなく個別ファイル指定を推奨
- **コミット前の確認**: `git status` と `git diff --cached` で変更内容を必ず確認

### 推奨手順

1. `git status` で変更ファイルを確認
2. `git add <specific-file>` で必要なファイルのみをステージング
3. `git diff --cached` でステージされた変更を確認
4. 関係のない変更があれば `git reset HEAD <file>` で除外
5. コミットメッセージは日本語でセマンティック形式を使用
