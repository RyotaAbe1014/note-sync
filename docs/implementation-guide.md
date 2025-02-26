# CommitNotes 実装ガイド

このガイドでは、CommitNotesアプリケーションの実装方法について詳細に説明します。

## 開発環境のセットアップ

### 必要なツール

- Node.js (v16以上)
- npm または yarn
- Git

### 初期セットアップ

```bash
# 既存のプロジェクトをクローン
git clone <repository-url>
cd commit-notes

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start
```

## 必要なライブラリのインストール

```bash
npm install isomorphic-git @lexical/react electron-store @octokit/rest
```

## プロジェクト構造の拡張

現在のプロジェクト構造を以下のように拡張します：

```
src/
├── main/              # Electronのメインプロセス
│   ├── main.ts        # エントリーポイント
│   ├── git/           # Git操作関連
│   └── fileSystem/    # ファイルシステム操作
├── renderer/          # レンダラープロセス（React）
│   ├── app.tsx        # Reactアプリケーション
│   ├── components/    # UIコンポーネント
│   │   ├── Editor/    # エディタ関連
│   │   ├── FileTree/  # ファイル一覧
│   │   └── GitOps/    # Git操作UI
│   ├── hooks/         # カスタムフック
│   └── store/         # 状態管理
└── preload/           # プリロードスクリプト
    └── preload.ts     # IPC通信の橋渡し
```

## 主要コンポーネントの実装

### 1. メインプロセスの設定

`src/main/main.ts`を拡張して、ファイルシステムとGit操作のためのAPIを提供します。

```typescript
// src/main/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { setupFileSystemHandlers } from './fileSystem/fileSystemHandlers';
import { setupGitHandlers } from './git/gitHandlers';

// ...既存のコード...

// ファイルシステムとGit操作のハンドラーをセットアップ
function setupIpcHandlers() {
  setupFileSystemHandlers();
  setupGitHandlers();
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();

  // ...既存のコード...
});
```

### 2. ファイルシステム操作の実装

```typescript
// src/main/fileSystem/fileSystemHandlers.ts
import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';

// アプリケーションのデータディレクトリを取得
const getAppDataPath = () => {
  const userDataPath = app.getPath('userData');
  const notesPath = path.join(userDataPath, 'notes');
  return notesPath;
};

export function setupFileSystemHandlers() {
  // ディレクトリ内のファイル一覧を取得
  ipcMain.handle('fs:list-files', async (event, dirPath) => {
    try {
      const basePath = dirPath || getAppDataPath();
      await fs.mkdir(basePath, { recursive: true });

      const files = await fs.readdir(basePath, { withFileTypes: true });
      return files.map(file => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: path.join(basePath, file.name)
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  });

  // ファイルの読み込み
  ipcMain.handle('fs:read-file', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  // ファイルの書き込み
  ipcMain.handle('fs:write-file', async (event, filePath, content) => {
    try {
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  });
}
```

### 3. Git操作の実装

```typescript
// src/main/git/gitHandlers.ts
import { ipcMain } from 'electron';
import * as git from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node';
import path from 'path';
import { app } from 'electron';

export function setupGitHandlers() {
  // リポジトリの初期化
  ipcMain.handle('git:init', async (event, repoPath) => {
    try {
      await git.init({ fs, dir: repoPath });
      return true;
    } catch (error) {
      console.error('Error initializing git repo:', error);
      throw error;
    }
  });

  // 変更のステージング
  ipcMain.handle('git:add', async (event, repoPath, filepath) => {
    try {
      await git.add({ fs, dir: repoPath, filepath });
      return true;
    } catch (error) {
      console.error('Error adding file to git:', error);
      throw error;
    }
  });

  // コミット
  ipcMain.handle('git:commit', async (event, repoPath, message, author) => {
    try {
      const sha = await git.commit({
        fs,
        dir: repoPath,
        message,
        author: {
          name: author.name,
          email: author.email
        }
      });
      return sha;
    } catch (error) {
      console.error('Error committing changes:', error);
      throw error;
    }
  });

  // プッシュ
  ipcMain.handle('git:push', async (event, repoPath, remoteUrl, token) => {
    try {
      await git.push({
        fs,
        http,
        dir: repoPath,
        remote: 'origin',
        ref: 'main',
        onAuth: () => ({ username: token })
      });
      return true;
    } catch (error) {
      console.error('Error pushing changes:', error);
      throw error;
    }
  });

  // プル
  ipcMain.handle('git:pull', async (event, repoPath, remoteUrl, token) => {
    try {
      await git.pull({
        fs,
        http,
        dir: repoPath,
        remote: 'origin',
        ref: 'main',
        onAuth: () => ({ username: token })
      });
      return true;
    } catch (error) {
      console.error('Error pulling changes:', error);
      throw error;
    }
  });
}
```

### 4. プリロードスクリプトの拡張

```typescript
// src/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// レンダラープロセスに公開するAPI
contextBridge.exposeInMainWorld('api', {
  // ファイルシステム操作
  fs: {
    listFiles: (dirPath) => ipcRenderer.invoke('fs:list-files', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', filePath, content)
  },

  // Git操作
  git: {
    init: (repoPath) => ipcRenderer.invoke('git:init', repoPath),
    add: (repoPath, filepath) => ipcRenderer.invoke('git:add', repoPath, filepath),
    commit: (repoPath, message, author) => ipcRenderer.invoke('git:commit', repoPath, message, author),
    push: (repoPath, remoteUrl, token) => ipcRenderer.invoke('git:push', repoPath, remoteUrl, token),
    pull: (repoPath, remoteUrl, token) => ipcRenderer.invoke('git:pull', repoPath, remoteUrl, token)
  }
});
```

### 5. Reactコンポーネントの実装

#### メインアプリケーション

```tsx
// src/renderer/app.tsx
import React, { useState, useEffect } from 'react';
import { FileTree } from './components/FileTree/FileTree';
import { Editor } from './components/Editor/Editor';
import { GitControls } from './components/GitOps/GitControls';
import './app.css';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  // ファイルが選択されたときの処理
  const handleFileSelect = async (filePath: string) => {
    try {
      setSelectedFile(filePath);
      const content = await window.api.fs.readFile(filePath);
      setFileContent(content);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  // ファイル内容が変更されたときの処理
  const handleContentChange = (content: string) => {
    setFileContent(content);
  };

  // ファイルを保存する処理
  const handleSave = async () => {
    if (selectedFile) {
      try {
        await window.api.fs.writeFile(selectedFile, fileContent);
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <FileTree onFileSelect={handleFileSelect} />
        <GitControls selectedFile={selectedFile} />
      </div>
      <div className="editor-container">
        <Editor
          content={fileContent}
          onChange={handleContentChange}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default App;
```

#### ファイルツリーコンポーネント

```tsx
// src/renderer/components/FileTree/FileTree.tsx
import React, { useState, useEffect } from 'react';
import './FileTree.css';

interface FileItem {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface FileTreeProps {
  onFileSelect: (filePath: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ onFileSelect }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentDir, setCurrentDir] = useState<string | null>(null);

  // ディレクトリの内容を読み込む
  const loadDirectory = async (dirPath: string | null) => {
    try {
      const fileList = await window.api.fs.listFiles(dirPath);
      setFiles(fileList);
      setCurrentDir(dirPath);
    } catch (error) {
      console.error('Error loading directory:', error);
    }
  };

  // 初期ロード
  useEffect(() => {
    loadDirectory(null);
  }, []);

  // ディレクトリをクリックしたときの処理
  const handleDirectoryClick = (dirPath: string) => {
    loadDirectory(dirPath);
  };

  // ファイルをクリックしたときの処理
  const handleFileClick = (filePath: string) => {
    onFileSelect(filePath);
  };

  // 親ディレクトリに戻る
  const handleBackClick = () => {
    if (currentDir) {
      const parentDir = currentDir.split('/').slice(0, -1).join('/');
      loadDirectory(parentDir.length > 0 ? parentDir : null);
    }
  };

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <button onClick={handleBackClick} disabled={!currentDir}>
          Back
        </button>
        <span>{currentDir || 'Root'}</span>
      </div>
      <ul className="file-list">
        {files.map((file) => (
          <li
            key={file.path}
            className={file.isDirectory ? 'directory' : 'file'}
            onClick={() => file.isDirectory
              ? handleDirectoryClick(file.path)
              : handleFileClick(file.path)
            }
          >
            {file.name}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

#### エディタコンポーネント

```tsx
// src/renderer/components/Editor/Editor.tsx
import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { MarkdownPlugin } from '@lexical/react/LexicalMarkdownPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, EditorState } from 'lexical';
import './Editor.css';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

// エディタの初期設定
const initialConfig = {
  namespace: 'CommitNotesEditor',
  theme: {
    // テーマ設定
  },
  onError: (error: Error) => {
    console.error('Editor error:', error);
  },
};

export const Editor: React.FC<EditorProps> = ({ content, onChange, onSave }) => {
  // エディタの内容が変更されたときの処理
  const handleEditorChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const markdown = root.getTextContent();
      onChange(markdown);
    });
  };

  // キーボードショートカットの処理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S または Cmd+S で保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <div className="editor" onKeyDown={handleKeyDown}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder">メモを入力してください...</div>}
          />
          <HistoryPlugin />
          <MarkdownPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <EditorContent content={content} />
        </div>
        <div className="editor-toolbar">
          <button onClick={onSave}>保存</button>
        </div>
      </LexicalComposer>
    </div>
  );
};

// エディタの内容を設定するためのコンポーネント
const EditorContent: React.FC<{ content: string }> = ({ content }) => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      if (content) {
        // Markdownをエディタの内容に変換する処理
        // 簡略化のため、ここでは単純にテキストとして挿入
        const paragraph = $createParagraphNode();
        paragraph.setTextContent(content);
        root.append(paragraph);
      }
    });
  }, [content, editor]);

  return null;
};
```

#### Git操作コンポーネント

```tsx
// src/renderer/components/GitOps/GitControls.tsx
import React, { useState } from 'react';
import './GitControls.css';

interface GitControlsProps {
  selectedFile: string | null;
}

export const GitControls: React.FC<GitControlsProps> = ({ selectedFile }) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gitStatus, setGitStatus] = useState('');

  // 変更をコミットする処理
  const handleCommit = async () => {
    if (!selectedFile || !commitMessage) return;

    setIsLoading(true);
    try {
      const repoPath = selectedFile.split('/').slice(0, -1).join('/');

      // ファイルをステージング
      await window.api.git.add(repoPath, selectedFile);

      // コミット
      const sha = await window.api.git.commit(repoPath, commitMessage, {
        name: 'CommitNotes User',
        email: 'user@example.com'
      });

      setGitStatus(`変更をコミットしました: ${sha.slice(0, 7)}`);
      setCommitMessage('');
    } catch (error) {
      console.error('Error committing changes:', error);
      setGitStatus('コミットに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 変更をプッシュする処理
  const handlePush = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const repoPath = selectedFile.split('/').slice(0, -1).join('/');
      const remoteUrl = 'https://github.com/username/repo.git'; // 設定から取得する
      const token = 'your-github-token'; // 安全に保存されたトークンを使用

      await window.api.git.push(repoPath, remoteUrl, token);
      setGitStatus('変更をGitHubにプッシュしました');
    } catch (error) {
      console.error('Error pushing changes:', error);
      setGitStatus('プッシュに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 変更をプルする処理
  const handlePull = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const repoPath = selectedFile.split('/').slice(0, -1).join('/');
      const remoteUrl = 'https://github.com/username/repo.git'; // 設定から取得する
      const token = 'your-github-token'; // 安全に保存されたトークンを使用

      await window.api.git.pull(repoPath, remoteUrl, token);
      setGitStatus('GitHubから最新の変更を取得しました');
    } catch (error) {
      console.error('Error pulling changes:', error);
      setGitStatus('プルに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="git-controls">
      <h3>Git操作</h3>
      <div className="commit-section">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="コミットメッセージを入力"
          disabled={isLoading || !selectedFile}
        />
        <button
          onClick={handleCommit}
          disabled={isLoading || !selectedFile || !commitMessage}
        >
          コミット
        </button>
      </div>
      <div className="git-actions">
        <button onClick={handlePush} disabled={isLoading || !selectedFile}>
          プッシュ
        </button>
        <button onClick={handlePull} disabled={isLoading || !selectedFile}>
          プル
        </button>
      </div>
      {gitStatus && <div className="git-status">{gitStatus}</div>}
    </div>
  );
};
```

## 設定管理の実装

```typescript
// src/main/settings/settingsManager.ts
import Store from 'electron-store';

interface AppSettings {
  githubToken?: string;
  githubUsername?: string;
  defaultRepository?: string;
  userEmail?: string;
  userName?: string;
  theme?: 'light' | 'dark';
}

// 設定のスキーマ
const schema = {
  githubToken: {
    type: 'string'
  },
  githubUsername: {
    type: 'string'
  },
  defaultRepository: {
    type: 'string'
  },
  userEmail: {
    type: 'string'
  },
  userName: {
    type: 'string'
  },
  theme: {
    type: 'string',
    enum: ['light', 'dark'],
    default: 'light'
  }
};

// 設定ストアのインスタンス
const settingsStore = new Store<AppSettings>({
  name: 'commit-notes-settings',
  schema
});

export { settingsStore };
```

## ビルドと配布

```bash
# アプリケーションのパッケージング
npm run package

# インストーラーの作成
npm run make
```

## 次のステップ

1. ユーザー認証の実装
2. 設定画面の作成
3. テーマ切り替え機能
4. タグ付け機能
5. 検索機能
6. 自動更新機能

## トラブルシューティング

- **Git操作が失敗する場合**：認証情報が正しく設定されているか確認
- **ファイル操作が失敗する場合**：アクセス権限を確認
- **エディタが正しく表示されない場合**：Lexicalの設定を確認

## 参考リソース

- [Electron ドキュメント](https://www.electronjs.org/docs)
- [isomorphic-git ドキュメント](https://isomorphic-git.org/docs)
- [Lexical ドキュメント](https://lexical.dev/docs/intro)
- [GitHub API ドキュメント](https://docs.github.com/en/rest)