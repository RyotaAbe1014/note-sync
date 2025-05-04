import { ipcMain } from 'electron';
// @ts-ignore
import Store from 'electron-store';
import OpenAI from 'openai';

import { AppSettings } from '../../types/appSettings';

const store = new Store<AppSettings>({
  name: 'app-settings',
});

const getOpenAIKey = () => {
  const settings: AppSettings | undefined = store.get('settings');
  return settings?.apiKeys?.openai;
};

export function setupGenerativeAiHandlers() {
  ipcMain.handle('ai:get-inline-response', async (event, prompt: string) => {
    const openaiKey = getOpenAIKey();
    if (!openaiKey) {
      throw new Error('OpenAI API key is not set');
    }
    const client = new OpenAI({
      apiKey: openaiKey,
    });

    const response = await client.responses.create({
      model: 'gpt-4o',
      instructions: `あなたは優れたエンジニアです。日本語で返答してください。言われたことに対してのみ返信をしてください。`,
      input: prompt,
    });

    console.log(response.output_text);
    return response.output_text;
  });
}
