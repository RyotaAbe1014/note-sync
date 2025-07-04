import { useEffect, useState } from 'react';

// 大きなファイルを効率的に読み込むためのカスタムフック
export function useFileLoader(filePath: string | null, onLoadComplete?: (content: string) => void) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [fileInfo, setFileInfo] = useState<{ size: number; isLargeFile: boolean } | null>(null);
  const [loadProgress, setLoadProgress] = useState<number>(0);

  // ファイルが変更されたときに実行
  useEffect(() => {
    if (!filePath) {
      setContent('');
      setFileInfo(null);
      setLoadProgress(0);
      return;
    }

    const loadFile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setContent('');
        setLoadProgress(0);

        // ファイル情報を取得
        const info = await window.api.fs.getFileInfo(filePath);
        setFileInfo(info);

        if (info.isLargeFile) {
          // 大きなファイルの場合は段階的に読み込む
          const loaded = await loadLargeFile(filePath, info.size);
          onLoadComplete?.(loaded);
        } else {
          // 小さなファイルの場合は一度に読み込む
          const fileContent = await window.api.fs.readFile(filePath);
          setContent(fileContent);
          setLoadProgress(100);
          onLoadComplete?.(fileContent);
        }
      } catch (err) {
        console.error('Error loading file:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [filePath]);

  // 大きなファイルを段階的に読み込む関数
  const loadLargeFile = async (path: string, fileSize: number) => {
    // 一度に読み込む行数
    const LINES_PER_CHUNK = 1000;
    let startLine = 1;
    let loadedContent = '';

    try {
      let hasMore = true;
      while (hasMore) {
        // 行単位で読み込む
        const chunk = await window.api.fs.readFileLines(path, startLine, LINES_PER_CHUNK);

        if (!chunk || chunk.length === 0) {
          break; // 読み込むデータがなければ終了
        }

        loadedContent += (loadedContent ? '\n' : '') + chunk;
        setContent(loadedContent);

        // 進捗を更新（概算）
        const estimatedProgress = Math.min(
          100,
          Math.round(((startLine * LINES_PER_CHUNK) / (fileSize / 100)) * 100)
        );
        setLoadProgress(estimatedProgress);

        // 次のチャンクの開始行
        startLine += LINES_PER_CHUNK;

        // UIをブロックしないように少し待機
        await new Promise((resolve) => setTimeout(resolve, 10));

        if (chunk.length < LINES_PER_CHUNK) {
          hasMore = false; // 最後のチャンクなら終了
        }
      }

      setLoadProgress(100);
      return loadedContent;
    } catch (err) {
      console.error('Error loading large file:', err);
      throw err;
    }
  };

  return { content, isLoading, error, fileInfo, loadProgress };
}
