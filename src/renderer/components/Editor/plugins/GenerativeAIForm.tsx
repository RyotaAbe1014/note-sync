import { useState } from 'react';

import { AlertCircle, ArrowRight, Check, Loader2, RefreshCw, Zap, ZapOff } from 'lucide-react';

import { useAIStream } from '../../../hooks/useAIStream';

interface GenerativeAIFormProps {
  onSubmit: (prompt: string) => void;
  onClose: () => void;
  enableStreaming?: boolean;
}

export function GenerativeAIForm({
  onSubmit,
  onClose,
  enableStreaming = false,
}: GenerativeAIFormProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreamingMode, setIsStreamingMode] = useState(enableStreaming);

  const {
    isStreaming,
    streamedText,
    error: streamError,
    startStream,
    cancelStream,
  } = useAIStream({
    onComplete: (fullText) => {
      setGeneratedResponse(fullText);
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    },
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setError(null);
      setGeneratedResponse(null);

      if (isStreamingMode) {
        // ストリーミングモード
        startStream(prompt);
      } else {
        // 非ストリーミングモード
        setIsLoading(true);
        try {
          const response = await window.api.ai.getInlineResponse(prompt);
          setGeneratedResponse(response);
        } catch (error) {
          console.error('AIコンテンツの生成中にエラーが発生しました:', error);
          setError(
            error instanceof Error ? error.message : 'AIコンテンツの生成中にエラーが発生しました'
          );
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleCancel = () => {
    if (isStreaming) {
      cancelStream();
    }
    setIsLoading(false);
  };

  const handleApply = () => {
    if (generatedResponse) {
      onSubmit(generatedResponse);
    }
  };

  const handleRetry = () => {
    setGeneratedResponse(null);
    setError(null);
    if (isStreaming) {
      cancelStream();
    }
  };

  const toggleStreamingMode = () => {
    if (!isStreaming && !isLoading) {
      setIsStreamingMode(!isStreamingMode);
    }
  };

  const currentError = error || streamError;
  const isProcessing = isLoading || isStreaming;
  const currentResponse = generatedResponse || (isStreaming ? streamedText : null);

  return (
    <div className="card bg-base-100 shadow-xl w-full max-w-md border border-base-300">
      <div className="card-body p-4">
        <h2 className="card-title flex justify-between items-center text-sm">
          <div className="flex items-center">
            <span className="text-primary mr-2">✨</span>
            AIテキスト生成
            {enableStreaming && (
              <div
                className="tooltip"
                data-tip={isStreamingMode ? 'ストリーミングモード' : '通常モード'}
              >
                <button
                  className={`btn btn-xs ml-2 ${isStreamingMode ? 'btn-primary' : 'btn-outline'}`}
                  onClick={toggleStreamingMode}
                  disabled={isProcessing}
                >
                  {isStreamingMode ? <Zap size={12} /> : <ZapOff size={12} />}
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            ✕
          </button>
        </h2>

        {currentError && (
          <div className="alert alert-error shadow-sm text-xs mb-2">
            <AlertCircle size={16} />
            <span>{currentError}</span>
          </div>
        )}

        {!currentResponse ? (
          // 生成フォーム
          <form onSubmit={handleGenerate}>
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">AIに指示を出す</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-24 focus:textarea-primary text-sm"
                placeholder="何を生成しますか？例：「ReactコンポーネントについてのTipsを3つ書いてください」"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                autoFocus
                disabled={isProcessing}
              />
              <label className="label py-1">
                <span className="label-text-alt text-xs text-base-content/70">
                  {isStreamingMode
                    ? 'AIがリアルタイムでテキストを生成します'
                    : 'AIが生成したテキストがカーソル位置に挿入されます'}
                </span>
              </label>
            </div>
            <div className="card-actions justify-end mt-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={isProcessing ? handleCancel : onClose}
                disabled={false}
              >
                {isProcessing ? '中止' : 'キャンセル'}
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!prompt.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {isStreamingMode ? 'ストリーミング中...' : '生成中...'}
                  </>
                ) : (
                  <>
                    生成 <ArrowRight size={16} className="ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          // 生成結果プレビュー
          <div>
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">生成結果</span>
              </label>
              <div className="bg-base-200 p-3 rounded-md text-sm whitespace-pre-wrap overflow-auto max-h-48">
                {currentResponse}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                )}
              </div>
              <label className="label py-1">
                <span className="label-text-alt text-xs text-base-content/70">
                  この内容でよろしければ「適用」をクリックしてください
                </span>
              </label>
            </div>
            <div className="card-actions justify-end mt-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleRetry}>
                <RefreshCw size={16} className="mr-1" />
                やり直す
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleApply}
                disabled={isStreaming}
              >
                <Check size={16} className="mr-1" />
                適用
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
