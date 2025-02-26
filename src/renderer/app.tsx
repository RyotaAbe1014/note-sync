import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Editor from './components/Editor/Editor';

const root = createRoot(document.body);
root.render(<App />);


export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">CommitNotes</h1>
        <p className="text-gray-600">Gitと連携するマークダウンエディタ</p>
      </header>
      <main>
        <Editor />
      </main>
    </div>
  );
}
