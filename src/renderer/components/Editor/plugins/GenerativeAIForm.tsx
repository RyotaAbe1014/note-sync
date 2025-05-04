import { useCallback, useState } from 'react';

import { AlertCircle, ArrowRight, Check, Loader2, RefreshCw } from 'lucide-react';

interface GenerativeAIFormProps {
  onSubmit: (prompt: string) => void;
  onClose: () => void;
}

export function GenerativeAIForm({ onSubmit, onClose }: GenerativeAIFormProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim()) {
        setIsLoading(true);
        setError(null);
        try {
          // AIからの応答を取得
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
    },
    [prompt]
  );

  const handleApply = useCallback(() => {
    if (generatedResponse) {
      onSubmit(generatedResponse);
    }
  }, [generatedResponse, onSubmit]);

  const handleRetry = useCallback(() => {
    setGeneratedResponse(null);
    setError(null);
  }, []);

  return (
    <div className="card bg-base-100 shadow-xl w-full max-w-md border border-base-300">
      <div className="card-body p-4">
        <h2 className="card-title flex justify-between items-center text-sm">
          <div className="flex items-center">
            <span className="text-primary mr-2">✨</span>
            AIテキスト生成
          </div>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            ✕
          </button>
        </h2>

        {error && (
          <div className="alert alert-error shadow-sm text-xs mb-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!generatedResponse ? (
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
                disabled={isLoading}
              />
              <label className="label py-1">
                <span className="label-text-alt text-xs text-base-content/70">
                  AIが生成したテキストがカーソル位置に挿入されます
                </span>
              </label>
            </div>
            <div className="card-actions justify-end mt-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClose}
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!prompt.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    生成中...
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
                {generatedResponse}
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
              <button type="button" className="btn btn-primary btn-sm" onClick={handleApply}>
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
