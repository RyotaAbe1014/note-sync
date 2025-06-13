import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { ipcMain } from 'electron';

import { AppSettings } from '../../types/appSettings';

let store: any;

const initStore = async () => {
  if (!store) {
    const Store = (await import('electron-store')).default;
    store = new Store<AppSettings>({
      name: 'app-settings',
    });
  }
  return store;
};

const getOpenAIKey = async () => {
  const storeInstance = await initStore();
  const settings: AppSettings | undefined = storeInstance.get('settings');
  return settings?.apiKeys?.openai;
};

// アクティブなストリームを管理するためのMap
const activeStreams = new Map<number, AbortController>();

export function setupStreamHandlers() {
  console.log('setupStreamHandlers: ストリームハンドラーを初期化中');

  ipcMain.on('ai:stream:start', async (event, prompt: string) => {
    const webContentsId = event.sender.id;
    console.log(
      `ai:stream:start: リクエスト受信 - webContentsId: ${webContentsId}, prompt: ${prompt}`
    );

    try {
      // 既存のストリームがあればキャンセル
      if (activeStreams.has(webContentsId)) {
        console.log(
          `ai:stream:start: 既存のストリームをキャンセル中 - webContentsId: ${webContentsId}`
        );
        activeStreams.get(webContentsId)?.abort();
        activeStreams.delete(webContentsId);
      }

      console.log('ai:stream:start: OpenAI APIキーを取得中');
      const openaiKey = await getOpenAIKey();
      if (!openaiKey) {
        console.error('ai:stream:start: OpenAI APIキーが設定されていません');
        event.sender.send('ai:stream:error', 'OpenAI API key is not set');
        return;
      }
      console.log('ai:stream:start: OpenAI APIキーの取得完了');

      // キャンセル用のAbortController
      const abortController = new AbortController();
      activeStreams.set(webContentsId, abortController);
      console.log(`ai:stream:start: AbortControllerを設定 - webContentsId: ${webContentsId}`);

      console.log('ai:stream:start: OpenAIクライアントを作成中');
      const openaiClient = createOpenAI({
        apiKey: openaiKey,
      });

      console.log('ai:stream:start: streamTextを実行中');
      const result = streamText({
        model: openaiClient('gpt-4o'),
        system:
          'あなたは優れたエンジニアです。日本語で返答してください。言われたことに対してのみ返信をしてください。',
        prompt: prompt,
        abortSignal: abortController.signal,
      });

      // textStreamではなく、resultを直接iterateする
      console.log('ai:stream:start: ストリーミング開始:', prompt);
      for await (const textPart of result.textStream) {
        console.log('ai:stream:start: チャンク受信:', textPart);
        // キャンセルされた場合は処理を停止
        if (abortController.signal.aborted) {
          console.log('ai:stream:start: ストリームがキャンセルされました');
          break;
        }

        console.log('ai:stream:start: チャンクをレンダラーに送信:', textPart);
        event.sender.send('ai:stream:chunk', textPart);
      }
      console.log('ai:stream:start: ストリーミング終了');

      // 正常終了
      activeStreams.delete(webContentsId);
      console.log(`ai:stream:start: 正常終了 - webContentsId: ${webContentsId}を削除`);
      event.sender.send('ai:stream:end');
    } catch (error) {
      console.error('ai:stream:start: ストリームエラー:', error);
      activeStreams.delete(webContentsId);

      // AbortErrorの場合はキャンセルとして処理
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('ai:stream:start: AbortErrorによる終了');
        event.sender.send('ai:stream:end');
      } else {
        console.error('ai:stream:start: 予期しないエラー:', error);
        event.sender.send(
          'ai:stream:error',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  });

  ipcMain.on('ai:stream:cancel', (event) => {
    const webContentsId = event.sender.id;

    if (activeStreams.has(webContentsId)) {
      activeStreams.get(webContentsId)?.abort();
      activeStreams.delete(webContentsId);
    }

    event.sender.send('ai:stream:end');
  });
}
