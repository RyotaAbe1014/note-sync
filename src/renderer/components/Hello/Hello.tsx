import { useState } from 'react';

type HelloProps = {
  name?: string;
};

export const Hello = ({ name = 'World' }: HelloProps) => {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded-lg">
      <h1 className="text-2xl font-bold mb-2" data-testid="greeting">
        Hello, {name}!
      </h1>
      <p className="mb-4">Welcome to NoteSync</p>
      <div className="flex items-center gap-2">
        <button
          className="btn btn-primary"
          onClick={() => setCount((c) => c + 1)}
          data-testid="increment-button"
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
};
