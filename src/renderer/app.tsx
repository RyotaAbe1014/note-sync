import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from './components/Editor/Editor';

const root = createRoot(document.body);
root.render(<App />);


export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <header className="mb-8 ">
        {/* TODO: Git  */}
      </header>
      <main>
        {/* TODO: add file tree */}
        <Editor />
      </main>
    </div>
  );
}
