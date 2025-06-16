/**
 * IPCチャンネル定数
 */
export const IPC_CHANNELS = {
  // App settings
  APP_GET_SETTINGS: 'app:get-settings',
  APP_SET_SETTINGS: 'app:set-settings',

  // Dialog
  DIALOG_SELECT_DIRECTORY: 'dialog:select-directory',

  // File system
  FS_LIST_FILES: 'fs:list-files',
  FS_READ_FILE: 'fs:read-file',
  FS_GET_FILE_INFO: 'fs:get-file-info',
  FS_READ_FILE_CHUNK: 'fs:read-file-chunk',
  FS_READ_FILE_LINES: 'fs:read-file-lines',
  FS_WRITE_FILE: 'fs:write-file',
  FS_ADD_FILE: 'fs:add-file',
  FS_RENAME_FILE: 'fs:rename-file',
  FS_REMOVE_FILE: 'fs:remove-file',
  FS_CREATE_DIRECTORY: 'fs:create-directory',
  FS_RENAME_DIRECTORY: 'fs:rename-directory',
  FS_REMOVE_DIRECTORY: 'fs:remove-directory',
  FS_SEARCH_FILES: 'fs:search-files',

  // Export
  EXPORT_PDF: 'export:export-pdf',
  EXPORT_EPUB: 'export:export-epub',

  // Git
  GIT_STATUS: 'git:status',
  GIT_ADD: 'git:add',
  GIT_UNSTAGE: 'git:unstage',
  GIT_COMMIT: 'git:commit',
  GIT_PUSH: 'git:push',
  GIT_PULL: 'git:pull',

  // AI
  AI_GET_INLINE_RESPONSE: 'ai:get-inline-response',
  AI_STREAM_START: 'ai:stream:start',
  AI_STREAM_CANCEL: 'ai:stream:cancel',
  AI_STREAM_CHUNK: 'ai:stream:chunk',
  AI_STREAM_END: 'ai:stream:end',
  AI_STREAM_ERROR: 'ai:stream:error',
} as const;

// 型定義
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
