import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Tokens {
  claude: string;
  gemini: string;
  chatgpt: string;
}

interface SettingsState {
  tokens: Tokens;
  shouldSave: boolean;
  isKeysLoading: boolean;
  error: string | null;
  setTokens: (provider: keyof Tokens, key: string) => void;
  toggleShouldSave: (save: boolean) => void;
  loadKeys: () => Promise<void>;
  saveKeys: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  tokens: {
    claude: "",
    gemini: "",
    chatgpt: "",
  },
  shouldSave: true,
  isKeysLoading: true,
  error: null,

  setTokens: (provider, key) => {
    set((state) => ({
      tokens: { ...state.tokens, [provider]: key },
    }));
  },

  toggleShouldSave: (save) => {
    set({
      shouldSave: save,
      tokens: save ? get().tokens : { claude: "", gemini: "", chatgpt: "" },
    });
    if (!save) {
      invoke("clear_tokens").catch(console.error);
    }
  },

  loadKeys: async () => {
    // If set to not saved doesn't even load.
    if (!get().shouldSave) {
      set({ isKeysLoading: false });
      return;
    }
    set({ isKeysLoading: true, error: null });
    try {
      const tokens = await invoke<Tokens>("get_tokens");
      set({ tokens });
    } catch (err) {
      const errorMessage = `Failed to load API keys: ${err instanceof Error ? err.message : String(err)}`;
      set({ error: errorMessage });
      console.error(errorMessage);
    } finally {
      set({ isKeysLoading: false });
    }
  },

  saveKeys: async () => {
    if (!get().shouldSave) return;
    const { tokens } = get();
    try {
      await invoke("save_tokens", { apiKeysJson: tokens });
      set({ error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: `Save failed: ${msg}` });
      console.error(error);
    }
  },
}));
