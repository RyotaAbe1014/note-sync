import { dialog, ipcMain } from 'electron';

import { validateSender } from '../security/ipcSecurity';

export function setupDialogHandlers() {
  ipcMain.handle('dialog:select-directory', async (event) => {
    validateSender(event);
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
