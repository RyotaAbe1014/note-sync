import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const ITERATIONS = 100000;

/**
 * 暗号化用のマスターキーを生成（初回のみ）
 */
export function generateMasterKey(): string {
  return randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * 文字列を暗号化
 * @param text 暗号化する文字列
 * @param masterKey マスターキー（Base64形式）
 * @returns 暗号化されたデータ（Base64形式）とsalt
 */
export function encrypt(text: string, masterKey: string): { encrypted: string; salt: string } {
  // Saltとランダムなivを生成
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // マスターキーからバッファを作成
  const keyBuffer = Buffer.from(masterKey, 'base64');

  // saltを使用してキーを派生
  const derivedKey = pbkdf2Sync(keyBuffer, salt, ITERATIONS, KEY_LENGTH, 'sha256');

  // 暗号化
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  // 認証タグを取得
  const tag = cipher.getAuthTag();

  // iv + tag + encrypted を結合してBase64でエンコード
  const combined = Buffer.concat([iv, tag, encrypted]);

  return {
    encrypted: combined.toString('base64'),
    salt: salt.toString('base64'),
  };
}

/**
 * 暗号化されたデータを復号化
 * @param encryptedData 暗号化されたデータ（Base64形式）
 * @param masterKey マスターキー（Base64形式）
 * @param salt Salt（Base64形式）
 * @returns 復号化された文字列
 */
export function decrypt(encryptedData: string, masterKey: string, salt: string): string {
  // Base64デコード
  const combined = Buffer.from(encryptedData, 'base64');
  const saltBuffer = Buffer.from(salt, 'base64');
  const keyBuffer = Buffer.from(masterKey, 'base64');

  // データを分離
  const iv = combined.slice(0, IV_LENGTH);
  const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);

  // saltを使用してキーを派生
  const derivedKey = pbkdf2Sync(keyBuffer, saltBuffer, ITERATIONS, KEY_LENGTH, 'sha256');

  // 復号化
  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}
