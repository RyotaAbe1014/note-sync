import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAIStreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export function useAIStream({ onChunk, onComplete, onError }: UseAIStreamOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fullTextRef = useRef('');

  const startStream = useCallback(
    (prompt: string) => {
      if (isStreaming) return;

      console.log('ストリーム開始リクエスト:', prompt);
      setIsStreaming(true);
      setStreamedText('');
      setError(null);
      fullTextRef.current = '';

      // レンダラーから送信
      (window as any).api?.electron?.ipcRenderer?.send('ai:stream:start', prompt);
    },
    [isStreaming]
  );

  const cancelStream = useCallback(() => {
    if (!isStreaming) return;

    (window as any).api?.electron?.ipcRenderer?.send('ai:stream:cancel');
    setIsStreaming(false);
  }, [isStreaming]);

  useEffect(() => {
    const handleChunk = (_event: any, chunk: string) => {
      console.log('チャンク受信:', chunk);
      fullTextRef.current += chunk;
      setStreamedText(fullTextRef.current);
      onChunk?.(chunk);
    };

    const handleEnd = (_event: any) => {
      console.log('ストリーム終了');
      setIsStreaming(false);
      onComplete?.(fullTextRef.current);
    };

    const handleError = (_event: any, errorMessage: string) => {
      console.log('ストリームエラー:', errorMessage);
      setIsStreaming(false);
      setError(errorMessage);
      onError?.(errorMessage);
    };

    // リスナーを登録
    window.api.electron?.ipcRenderer?.on('ai:stream:chunk', handleChunk);
    window.api.electron?.ipcRenderer?.on('ai:stream:end', handleEnd);
    window.api.electron?.ipcRenderer?.on('ai:stream:error', handleError);

    // クリーンアップ
    return () => {
      window.api.electron?.ipcRenderer?.removeListener('ai:stream:chunk', handleChunk);
      window.api.electron?.ipcRenderer?.removeListener('ai:stream:end', handleEnd);
      window.api.electron?.ipcRenderer?.removeListener('ai:stream:error', handleError);
    };
  }, [onChunk, onComplete, onError]);

  return {
    isStreaming,
    streamedText,
    error,
    startStream,
    cancelStream,
  };
}
