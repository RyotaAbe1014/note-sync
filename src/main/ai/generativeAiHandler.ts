import { ipcMain } from 'electron';
// @ts-ignore
import Store from 'electron-store';

import { AppSettings } from '../../types/appSettings';

const store = new Store<AppSettings>({
  name: 'app-settings',
});

const getOpenAIKey = () => {
  const settings: AppSettings | undefined = store.get('settings');
  return settings?.apiKeys?.openai;
};

export function setupGenerativeAiHandlers() {
  ipcMain.handle('generative-ai:get-inline-response', async (event, prompt: string) => {
    // const response = await getInlineResponse(prompt);
    return 'test';
  });
}
