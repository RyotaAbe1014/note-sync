import { useCallback, useState } from 'react';

import { ArrowRight } from 'lucide-react';

interface GenerativeAIFormProps {
  onSubmit: (prompt: string) => void;
  onClose: () => void;
}

export function GenerativeAIForm({ onSubmit, onClose }: GenerativeAIFormProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim()) {
        onSubmit(prompt);
        setPrompt('');
      }
    },
    [prompt, onSubmit]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="card bg-base-100 shadow-lg w-full max-w-2xl">
        <div className="card-body">
          <h2 className="card-title flex justify-between">
            AIテキスト生成
            <button className="btn btn-sm btn-ghost" onClick={onClose}>
              ✕
            </button>
          </h2>
          <form onSubmit={handleSubmit}>
            <textarea
              className="textarea textarea-bordered w-full h-32"
              placeholder="何を生成しますか？例：「ReactコンポーネントについてのTipsを3つ書いてください」"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              autoFocus
            />
            <div className="card-actions justify-end mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary" disabled={!prompt.trim()}>
                生成 <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
