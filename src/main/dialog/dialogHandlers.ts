import { dialog, ipcMain } from 'electron';

import { validateSender } from '../common/security/ipcSecurity';
import { IPC_CHANNELS } from '../constants';

export function setupDialogHandlers() {
  ipcMain.handle(IPC_CHANNELS.DIALOG_SELECT_DIRECTORY, async (event) => {
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
