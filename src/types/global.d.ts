/// <reference types="vite/client" />

interface Window {
  api: {
    app: {
      getSettings: () => Promise<any>;
      setSettings: (settings: any) => Promise<void>;
    };
    dialog: {
      selectDirectory: () => Promise<string>;
    };
    file: {
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<void>;
      listFiles: (
        dir: string
      ) => Promise<Array<{ name: string; path: string; isDirectory: boolean }>>;
    };
    git: {
      init: (dir: string) => Promise<void>;
      commit: (dir: string, message: string) => Promise<void>;
      push: (dir: string) => Promise<void>;
      pull: (dir: string) => Promise<void>;
    };
  };
}
