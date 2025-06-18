import {
  createChatAPI,
  deleteChatAPI,
  listChatsAPI,
  listMessagesAPI,
  MessageRS,
} from "./chatApi.tsx";
import { Chat, ChatMessage, ChatState } from "../stores/useChatStore.tsx";
import type { StoreApi } from "zustand";
import { produce } from "immer";

type SetStateFn = StoreApi<ChatState>["setState"];
type GetStateFn = StoreApi<ChatState>["getState"];

export const createChatAction =
  (set: SetStateFn, get: GetStateFn) => async () => {
    try {
      const chatsMap = get().chats;
      const nextNum = chatsMap.size
        ? Math.max(...Array.from(chatsMap.values()).map((chat) => chat.id)) + 1
        : 1;

      const newChatRS = await createChatAPI(`Chat ${nextNum}`);
      const newChat = { id: newChatRS.id, uuid: newChatRS.uuid, messages: [] };

      set(
        produce((state: ChatState) => {
          state.chats.set(newChat.id, newChat);
          // Add the new chat ID to the beginning of the chatIds array to show it first
          state.chatIds.unshift(newChat.id);
          state.selectedChatId = newChat.id;
          state.prompt = "";
          state.error = null;
        }),
      );
    } catch (e) {
      set({ error: `Failed to create chat: ${e}` });
    }
  };

export const deleteChatAction = (
  set: SetStateFn,
): ((chatId: number) => Promise<void>) => {
  return async (chatId: number) => {
    try {
      await deleteChatAPI(chatId);

      set(
        produce((state: ChatState) => {
          state.chats.delete(chatId);
          state.chatIds = state.chatIds.filter((id) => id !== chatId);
          if (state.selectedChatId === chatId) {
            state.selectedChatId =
              state.chatIds.length > 0 ? state.chatIds[0] : null;
          }

          state.prompt = "";
          state.error = null;
        }),
      );
    } catch (e) {
      set({ error: `Failed to delete chat: ${e}` });
    }
  };
};

const mapRole = (r: MessageRS["role"]): ChatMessage["role"] =>
  r === "assistant" || r === "user" ? r : "user";

export const listChatsAction =
  (set: SetStateFn, get: GetStateFn) => async () => {
    try {
      const rawChats = (await listChatsAPI()) as Array<Omit<Chat, "messages">>;

      if (rawChats.length === 0) {
        set({
          chats: new Map(),
          chatIds: [],
          chatMessages: new Map(),
          selectedChatId: null,
          error: null,
        });
        return;
      }

      // Fetch all messages in parallel, collecting [chatId, messages]
      const pairs = await Promise.all(
        rawChats.map(async (chat) => {
          let rawMessages: MessageRS[] = [];
          try {
            rawMessages = await listMessagesAPI(chat.id);
          } catch (err) {
            console.warn(`Failed to load messages for chat ${chat.id}:`, err);
          }

          const messages: ChatMessage[] = rawMessages.map((m) => ({
            id: m.id,
            role: mapRole(m.role),
            content: m.content,
            provider: m.provider,
          }));

          return { chatId: chat.id, messages };
        }),
      );

      const currentSelectedChat = get().selectedChatId;
      const messagesByChat = new Map(
        pairs.map(({ chatId, messages }) => [chatId, messages] as const),
      );
      const chatIds = rawChats.map((c) => c.id);
      set(
        produce((state: ChatState) => {
          state.chatIds = chatIds;
          state.chats = new Map(rawChats.map((c) => [c.id, c]));
          state.chatMessages = messagesByChat;
          state.selectedChatId =
            currentSelectedChat != null && state.chats.has(currentSelectedChat)
              ? currentSelectedChat
              : (chatIds[0] ?? null);

          state.error = null;
        }),
      );
    } catch (err: any) {
      console.error("listChatsAction failed:", err);
      set((state) => ({
        ...state,
        error: `Failed to fetch chats: ${String(err)}`,
      }));
    }
  };
