import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Editor from './components/Editor/Editor';

const root = createRoot(document.body);
root.render(<App />);


export default function App() {
  return <Editor />;
}
