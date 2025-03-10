import { AppSettings } from '../types/appSettings';
import { StatusMatrix } from '../types/gitStatus';

interface FileInfo {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface GitAuthor {
  name: string;
  email: string;
}

interface Window {
  api: {
    app: {
      getSettings: () => Promise<AppSettings>;
      setSettings: (settings: AppSettings) => Promise<void>;
    };
    dialog: {
      selectDirectory: () => Promise<string | null>;
    };
    fs: {
      listFiles: (dirPath: string | null) => Promise<FileInfo[]>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      addFile: (filePath: string, content: string) => Promise<boolean>;
      renameFile: (filePath: string, newName: string) => Promise<boolean>;
      removeFile: (filePath: string) => Promise<boolean>;
      createDirectory: (dirPath: string) => Promise<boolean>;
      renameDirectory: (dirPath: string, newName: string) => Promise<boolean>;
      removeDirectory: (dirPath: string) => Promise<boolean>;
    };
    git: {
      add: (filepath: string) => Promise<void>;
      unstage: (filepath: string) => Promise<void>;
      commit: (message: string, author: GitAuthor) => Promise<string>;
      push: () => Promise<boolean>;
      pull: () => Promise<boolean>;
      status: () => Promise<StatusMatrix>;
    };
  };
}
