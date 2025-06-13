import { AppSettings } from '../types/appSettings';
import { StatusMatrix } from '../types/gitStatus';

interface FileInfo {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface FileStats {
  size: number;
  isLargeFile: boolean;
}

interface GitAuthor {
  name: string;
  email: string;
}

declare global {
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
        getFileInfo: (filePath: string) => Promise<FileStats>;
        readFileChunk: (filePath: string, start: number, end: number) => Promise<string>;
        readFileLines: (filePath: string, startLine: number, lineCount: number) => Promise<string>;
        writeFile: (filePath: string, content: string) => Promise<boolean>;
        addFile: (filePath: string, content: string) => Promise<boolean>;
        renameFile: (filePath: string, newName: string) => Promise<boolean>;
        removeFile: (filePath: string) => Promise<boolean>;
        createDirectory: (dirPath: string) => Promise<boolean>;
        renameDirectory: (dirPath: string, newName: string) => Promise<boolean>;
        removeDirectory: (dirPath: string) => Promise<boolean>;
      };
      export: {
        exportPdf: (filePath: string) => Promise<string>;
        exportEpub: (filePath: string) => Promise<string>;
      };
      git: {
        add: (filepath: string) => Promise<void>;
        unstage: (filepath: string) => Promise<void>;
        commit: (message: string) => Promise<string>;
        push: () => Promise<boolean>;
        pull: () => Promise<boolean>;
        status: () => Promise<StatusMatrix>;
      };
      ai: {
        getInlineResponse: (prompt: string) => Promise<string>;
      };
    };
    electron?: {
      ipcRenderer?: {
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, listener: (...args: any[]) => void) => void;
        removeListener: (channel: string, listener: (...args: any[]) => void) => void;
      };
    };
  }
}
