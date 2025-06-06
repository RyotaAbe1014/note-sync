import { dialog, ipcMain } from 'electron';

export function setupDialogHandlers() {
  ipcMain.handle('dialog:select-directory', async (_) => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'ディレクトリを選択',
    });

    if (result.canceled) {
      return null;
    }

    return result.filePaths[0];
  });
}
