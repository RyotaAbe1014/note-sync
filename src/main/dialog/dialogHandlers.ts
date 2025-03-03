import { ipcMain, dialog } from 'electron';

export function setupDialogHandlers() {
  ipcMain.handle('dialog:select-directory', async (event) => {
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