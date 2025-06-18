import { create } from "zustand";
import { produce } from "immer";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore, Tokens } from "./useSettingsStore.tsx";
import { clearChatAPI, createMessageAPI } from "../api/chatApi.tsx";
import {
  createChatAction,
  deleteChatAction,
  listChatsAction,
} from "../api/chatActions.tsx";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  provider?: string;
  is_error?: boolean;
  id: number;
}

export interface LLMResponse {
  provider: string;
  content: string;
  error?: string;
}

export interface Chat {
  id: number;
  uuid: string;
  name?: string;
}

export interface ChatState {
  // A list with the existent chat id.
  chatIds: number[];
  chats: Map<number, Chat>;
  chatMessages: Map<number, ChatMessage[]>;
  chatLoading: Record<number, boolean>;
  selectedChatId: number | null;
  prompt: string;
  selectedApi: keyof Tokens;
  selectedModel: string;
  error: string | null;

  setPrompt: (text: string) => void;
  setSelectedApi: (api: keyof Tokens) => void;
  setSelectedModel: (model: string) => void;
  setError: (err: string | null) => void;

  createChat: () => Promise<void>;
  deleteChat: (id: number) => Promise<void>;
  listChats: () => Promise<void>;
  selectChat: (id: number) => void;
  clearChat: () => void;

  sendMessage: () => Promise<void>;
}

const apiCallMap = {
  claude: "call_claude_api",
  gemini: "call_gemini_api",
  chatgpt: "call_chatgpt_api",
};

const PROVIDER_DISPLAY_NAME: Record<string, string> = {
  gemini: "Gemini",
  chatgpt: "ChatGPT",
  claude: "Claude",
};

export const useChatStore = create<ChatState>((set, get) => ({
  chatIds: [],
  chats: new Map<number, Chat>(),
  chatMessages: new Map<number, ChatMessage[]>(),
  chatLoading: {},
  selectedChatId: null,
  prompt: "",
  selectedApi: "chatgpt",
  selectedModel: "o4-mini",
  error: null,

  setPrompt: (text) => set({ prompt: text }),
  setSelectedApi: (api) => set({ selectedApi: api }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setError: (err) => set({ error: err }),

  createChat: createChatAction(set, get),
  deleteChat: deleteChatAction(set),
  listChats: listChatsAction(set, get),
  selectChat: (id) => {
    set({ selectedChatId: id, prompt: "", error: null });
  },

  clearChat: async () => {
    const { selectedChatId } = get();
    if (selectedChatId == null) return;
    set(
      produce((state) => {
        state.chatMessages.set(selectedChatId, []);
        state.error = null;
      }),
    );
    clearChatAPI(selectedChatId);
  },

  sendMessage: async () => {
    const { prompt, selectedApi, selectedModel, selectedChatId } = get();

    if (!prompt.trim() || selectedChatId == null) return;

    // Push user message
    const userMsg: ChatMessage = {
      role: "user",
      content: prompt.trimEnd(),
      provider: PROVIDER_DISPLAY_NAME[selectedApi],
      id: Math.random(), // TODO: Correct id
    };
    set(
      produce((state) => {
        // Get current messages for the selected chat
        const currentMessages = state.chatMessages.get(selectedChatId) || [];
        currentMessages.push(userMsg);
        state.chatMessages.set(selectedChatId, currentMessages);
        state.chatLoading[selectedChatId] = true;
        state.prompt = "";
        state.error = null;
      }),
    );

    createMessageAPI(selectedChatId, userMsg).catch((e) =>
      console.error("Create user msg failed:", e),
    );

    // Check API key
    const apiKey = useSettingsStore.getState().tokens[selectedApi];
    if (!apiKey) {
      const errText = `Missing API key for ${selectedApi}`;
      const errMsg: ChatMessage = {
        role: "assistant",
        content: errText,
        provider: PROVIDER_DISPLAY_NAME[selectedApi],
        is_error: true,
        id: Math.random(), // TODO: Correct id
      };
      set(
        produce((state) => {
          const currentMessages = state.chatMessages.get(selectedChatId) ?? [];
          currentMessages.push(errMsg);
          state.chatMessages.set(selectedChatId, currentMessages);
          state.error = errText;
          state.chatLoading[selectedChatId] = false;
        }),
      );
      return;
    }

    // Invoke LLM
    try {
      const command = apiCallMap[selectedApi]!;
      const payload = {
        apiKey,
        messages: get()
          .chatMessages.get(selectedChatId)!
          .map((m) => ({ role: m.role, content: m.content })),
        model: selectedModel || null,
      };
      const response: LLMResponse = await invoke(command, payload);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.content,
        provider: PROVIDER_DISPLAY_NAME[selectedApi],
        id: Math.random(),
      };

      createMessageAPI(selectedChatId, assistantMsg).catch((e) =>
        console.error("Create assistant message failed:", e),
      );

      set(
        produce((state) => {
          const currentMessages = state.chatMessages.get(selectedChatId) ?? [];
          currentMessages.push(assistantMsg);
          state.chatMessages.set(selectedChatId, currentMessages);
        }),
      );
    } catch (e: any) {
      const errText = `Error from ${selectedApi}: ${e}`;
      console.error(errText);
      const errMsg: ChatMessage = {
        role: "assistant",
        content: errText,
        provider: PROVIDER_DISPLAY_NAME[selectedApi],
        is_error: true,
        id: Math.random(),
      };
      set(
        produce((state) => {
          const currentMessages = state.chatMessages.get(selectedChatId) ?? [];
          currentMessages.push(errMsg);
          state.chatMessages.set(selectedChatId, currentMessages);
          state.error = errText;
        }),
      );
    } finally {
      set(
        produce((state) => {
          state.chatLoading[selectedChatId] = false;
        }),
      );
    }
  },
}));
