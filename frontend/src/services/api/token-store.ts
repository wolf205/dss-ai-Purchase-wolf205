/**
 * In-memory Token Store
 * Lưu trữ accessToken hoàn toàn trong memory (closure), TUYỆT ĐỐI không lưu vào localStorage/sessionStorage.
 */

type TokenListener = (token: string | null) => void;

let inMemoryAccessToken: string | null = null;
const listeners: Set<TokenListener> = new Set();

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
  listeners.forEach((listener) => listener(token));
};

export const clearAccessToken = (): void => {
  setAccessToken(null);
};

export const subscribeToTokenChanges = (listener: TokenListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
