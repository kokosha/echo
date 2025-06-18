import { invoke } from "@tauri-apps/api/core";
import { Chat, ChatMessage } from "../stores/useChatStore";

export interface ChatRS {
  id: number;
  uuid: string;
  title: string;
  created_at: number;
}

export interface MessageRS {
  id: number;
  uuid: string;
  chat_id: number;
  sender_id: number | null;
  provider: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

// Tauri API invocation
// Create Chat - A new chat is created between the user and the assistant
export async function createChatAPI(title: string): Promise<ChatRS> {
  return await invoke("create_chat", { title });
}

// Delete Chat - A chat is deleted between the user and the assistant.
export async function deleteChatAPI(chatId: number): Promise<void> {
  return await invoke("delete_chat", { chatId });
}

// Clear Chat - Delete all messages from chat
export async function clearChatAPI(chatId: number): Promise<void> {
  return await invoke("clear_chat", { chatId });
}

// List Chats - The function return a lists of all chats that exists.
export async function listChatsAPI(): Promise<Omit<Chat, "messages">[]> {
  return (await invoke("list_chats")) as Chat[];
}

export async function createMessageAPI(
  chatId: number,
  msg: Pick<ChatMessage, "role" | "content" | "provider">,
): Promise<void> {
  await invoke("create_message", {
    chatId,
    senderId: null,
    provider: msg.provider,
    role: msg.role,
    content: msg.content,
  });
}

export async function listMessagesAPI(chatId: number): Promise<MessageRS[]> {
  return (await invoke("list_messages", { chatId })) as MessageRS[];
}

// Map providers to tauri commands
export const apiCallMap = {
  claude: "call_claude_api",
  gemini: "call_gemini_api",
  chatgpt: "call_chatgpt_api",
} as const;

// Helper just for display names
export const PROVIDER_DISPLAY_NAME: Record<string, string> = {
  gemini: "Gemini",
  chatgpt: "ChatGPT",
  claude: "Claude",
};
