import { ipcMain } from 'electron';
// @ts-ignore
import Store from 'electron-store';
import { AppSettings } from '../../types/appSettings';

const appSettingsStore = new Store<AppSettings>({
  name: 'app-settings',
});

export function setupAppSettingsHandlers() {
  ipcMain.handle('app:get-settings', async (event) => {
    return appSettingsStore.get('settings');
  });

  ipcMain.handle('app:set-settings', async (event, settings) => {
    appSettingsStore.set('settings', settings);
  });
}