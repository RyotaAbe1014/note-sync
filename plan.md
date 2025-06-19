# NoteSync ファイル検索機能実装計画

## 概要

NoteSyncアプリケーションにファイル検索機能を追加する実装計画書です。

## 実装目標

- ファイル名による検索
- ファイル内容による全文検索
- リアルタイム検索結果表示
- 検索結果からのファイル直接オープン

## フェーズ別実装計画

### Phase 1: 基本的なファイル名検索（推定工数: 2-3日）

#### 1.1 バックエンド実装

- [ ] IPCチャンネル追加

  - `FS_SEARCH_FILES: 'fs:search-files'` を `src/main/constants/index.ts` に追加

- [ ] 検索ハンドラー実装

  - `src/main/fileSystem/fileSearchHandler.ts` を新規作成
  - 再帰的にディレクトリを探索
  - ファイル名のパターンマッチング
  - `.md` ファイルのみを対象

- [ ] Preload APIの拡張
  - `src/main/preload.ts` に検索APIを追加
  - `window.api.fs.searchFiles(searchTerm, options)`

#### 1.2 フロントエンド実装

- [ ] 検索UIコンポーネント作成

  - `src/renderer/components/Search/SearchBar.tsx`
  - `src/renderer/components/Search/SearchResults.tsx`
  - `src/renderer/components/Search/index.tsx`

- [ ] FileTreeコンポーネントとの統合
  - 検索モードの追加
  - 検索結果の表示切替
  - 検索結果のハイライト

#### 1.3 テスト実装

- [ ] バックエンドユニットテスト
- [ ] フロントエンドコンポーネントテスト
- [ ] E2Eテスト

### Phase 2: ファイル内容検索（推定工数: 3-4日）

#### 2.1 バックエンド拡張

- [ ] 全文検索ハンドラー実装

  - ファイル内容の読み込みとマッチング
  - 検索結果にマッチした行番号と内容を含める
  - 大規模ファイルの効率的な処理

- [ ] 検索オプションの実装
  - 大文字小文字の区別
  - 正規表現サポート
  - ファイルタイプフィルター

#### 2.2 フロントエンド拡張

- [ ] 検索オプションUI

  - 検索タイプ切替（ファイル名/内容）
  - 詳細オプション設定

- [ ] 検索結果プレビュー
  - マッチした内容のプレビュー表示
  - 該当箇所のハイライト

### Phase 3: 高度な機能（推定工数: 2-3日）

#### 3.1 パフォーマンス最適化

- [ ] 検索結果のページネーション
- [ ] 検索処理のキャンセル機能
- [ ] インデックスベースの高速検索（オプション）

#### 3.2 UX向上

- [ ] 検索履歴の保存と表示
- [ ] キーボードショートカット（Cmd/Ctrl+F）
- [ ] 検索結果の並び替えオプション
- [ ] 検索結果のエクスポート

## 技術的詳細

### IPCチャンネル定義

```typescript
// src/main/constants/index.ts
FS_SEARCH_FILES: 'fs:search-files';
```

### API インターフェース

```typescript
// 検索オプション
interface SearchOptions {
  searchIn: 'filename' | 'content' | 'both';
  caseSensitive?: boolean;
  useRegex?: boolean;
  maxResults?: number;
}

// 検索結果
interface SearchResult {
  path: string;
  name: string;
  matches?: {
    line: number;
    content: string;
    highlight: [number, number];
  }[];
}
```

### コンポーネント構造

```
src/renderer/components/
├── Search/
│   ├── index.tsx           // メインコンポーネント
│   ├── SearchBar.tsx       // 検索入力
│   ├── SearchResults.tsx   // 結果表示
│   ├── SearchOptions.tsx   // オプション設定
│   └── hooks/
│       └── useSearch.ts    // 検索ロジック
```

## セキュリティ考慮事項

- パストラバーサル攻撃の防止
- 検索対象ディレクトリの制限
- 大規模ファイルによるDoS攻撃の防止

## テスト計画

1. **ユニットテスト**

   - 検索アルゴリズムの正確性
   - エッジケースの処理

2. **統合テスト**

   - IPC通信の動作確認
   - UIとバックエンドの連携

3. **パフォーマンステスト**
   - 大規模ディレクトリでの検索速度
   - メモリ使用量の監視

## リスクと対策

| リスク                                   | 影響度 | 対策                             |
| ---------------------------------------- | ------ | -------------------------------- |
| 大規模ディレクトリでのパフォーマンス低下 | 高     | 非同期処理、ページネーション実装 |
| 検索中のUIフリーズ                       | 中     | Web Workerの活用検討             |
| メモリ使用量の増大                       | 中     | ストリーミング処理の実装         |

## 成功指標

- 1000ファイル以下のディレクトリで1秒以内に検索完了
- 検索結果の正確性 100%
- UIの応答性維持（検索中も他の操作可能）

## 今後の拡張可能性

- ファジー検索の実装
- 検索結果の保存・共有機能
- AIを活用したセマンティック検索
- タグベースの分類と検索

修正お願いします
@src/renderer/components/Search/SearchBar.tsx

@src/renderer/components/FileTree/FileTree.tsx
検索はこの中に移動しましょう

そしてnavigateToFileでファイルを変更するのではなく、files、rootDir、currentDirを使用して検索結果をクリックした時の動作を調整しましょう
