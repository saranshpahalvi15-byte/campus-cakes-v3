/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SafeStorage {
  private memoryStore: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn("Storage access denied, reading from memoryStore instead for key:", key);
    }
    return this.memoryStore[key] !== undefined ? this.memoryStore[key] : null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("Storage access denied, saving to memoryStore instead for key:", key);
    }
    this.memoryStore[key] = String(value);
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
         window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn("Storage access denied, removing from memoryStore instead for key:", key);
    }
    delete this.memoryStore[key];
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn("Storage access denied, clearing memoryStore instead");
    }
    this.memoryStore = {};
  }
}

export const safeStorage = new SafeStorage();
