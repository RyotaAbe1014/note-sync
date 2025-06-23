import { describe, expect, it } from 'vitest';

import { decrypt, encrypt, generateMasterKey } from './cryptoUtils';

describe('cryptoUtils', () => {
  describe('generateMasterKey', () => {
    it('マスターキーを生成できる', () => {
      const key1 = generateMasterKey();
      const key2 = generateMasterKey();

      expect(key1).toBeTruthy();
      expect(key2).toBeTruthy();
      expect(key1).not.toBe(key2); // 毎回異なるキーが生成される
      expect(Buffer.from(key1, 'base64').length).toBe(32); // 256 bits
    });
  });

  describe('encrypt and decrypt', () => {
    it('文字列を暗号化して復号化できる', () => {
      const masterKey = generateMasterKey();
      const originalText = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';

      const { encrypted, salt } = encrypt(originalText, masterKey);
      const decrypted = decrypt(encrypted, masterKey, salt);

      expect(decrypted).toBe(originalText);
    });

    it('異なるマスターキーでは復号化できない', () => {
      const masterKey1 = generateMasterKey();
      const masterKey2 = generateMasterKey();
      const originalText = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';

      const { encrypted, salt } = encrypt(originalText, masterKey1);

      expect(() => {
        decrypt(encrypted, masterKey2, salt);
      }).toThrow();
    });

    it('異なるsaltでは復号化できない', () => {
      const masterKey = generateMasterKey();
      const originalText = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';

      const { encrypted } = encrypt(originalText, masterKey);
      const { salt: differentSalt } = encrypt('dummy', masterKey);

      expect(() => {
        decrypt(encrypted, masterKey, differentSalt);
      }).toThrow();
    });

    it('暗号化は毎回異なる結果を返す', () => {
      const masterKey = generateMasterKey();
      const originalText = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';

      const result1 = encrypt(originalText, masterKey);
      const result2 = encrypt(originalText, masterKey);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.salt).not.toBe(result2.salt);

      // 両方とも正しく復号化できる
      expect(decrypt(result1.encrypted, masterKey, result1.salt)).toBe(originalText);
      expect(decrypt(result2.encrypted, masterKey, result2.salt)).toBe(originalText);
    });

    it('空文字列も暗号化・復号化できる', () => {
      const masterKey = generateMasterKey();
      const originalText = '';

      const { encrypted, salt } = encrypt(originalText, masterKey);
      const decrypted = decrypt(encrypted, masterKey, salt);

      expect(decrypted).toBe(originalText);
    });

    it('日本語文字列も暗号化・復号化できる', () => {
      const masterKey = generateMasterKey();
      const originalText = 'これはテストです。🔐';

      const { encrypted, salt } = encrypt(originalText, masterKey);
      const decrypted = decrypt(encrypted, masterKey, salt);

      expect(decrypted).toBe(originalText);
    });
  });
});
