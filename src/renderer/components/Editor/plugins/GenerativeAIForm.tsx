import { useCallback, useState } from 'react';

import { ArrowRight, Loader2 } from 'lucide-react';

interface GenerativeAIFormProps {
  onSubmit: (prompt: string) => void;
  onClose: () => void;
}

export function GenerativeAIForm({ onSubmit, onClose }: GenerativeAIFormProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim()) {
        setIsLoading(true);
        try {
          // AI呼び出しを模擬するための遅延
          await new Promise((resolve) => setTimeout(resolve, 1000));
          onSubmit(prompt);
          setPrompt('');
        } finally {
          setIsLoading(false);
        }
      }
    },
    [prompt, onSubmit]
  );

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
        <form onSubmit={handleSubmit}>
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
      </div>
    </div>
  );
}
