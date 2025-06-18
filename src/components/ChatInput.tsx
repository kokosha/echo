import React from "react";
import { useChatStore } from "../stores/useChatStore";
import ChatInputOptions from "./ChatInputOptions";

export interface ChatInputProps {
  isSidebarOpen: boolean;
}

export default function ChatInput({ isSidebarOpen }: ChatInputProps) {
  const { prompt, setPrompt, sendMessage, chatLoading, selectedChatId } =
    useChatStore();
  const isChatLoading =
    selectedChatId != null ? !!chatLoading[selectedChatId] : false;

  // Chat Input Box autoexpanding.
  const lineCount = prompt.split("\n").length;
  const isExpanded = lineCount > 5;

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isChatLoading) sendMessage();
    }
  };

  const onClickSend = () => {
    if (prompt.trim() && !isChatLoading) sendMessage();
  };

  return (
    <div
      className={
        `fixed bottom-0 right-0 flex bg-gray-900 p-4 transition-all duration-200 ` +
        (isSidebarOpen ? "left-80" : "left-12") // TODO: need to find a way to position the Chat Input
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col space-y-2 rounded-2xl bg-gray-900 p-4">
        <div className="relative flex items-end">
          <textarea
            className="flex-1 resize-none rounded-2xl border border-gray-600 bg-gray-700 p-4 pr-16 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            style={{
              minHeight: isExpanded ? "12rem" : "6rem",
              maxHeight: isExpanded ? "30rem" : "20rem",
              overflowY: "auto",
            }}
            placeholder="Type your message here…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isChatLoading}
          />

          <div className="absolute bottom-0 right-3 flex h-[6rem] items-center">
            <button
              onClick={onClickSend}
              disabled={isChatLoading || !prompt.trim()}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 ${
                isChatLoading || !prompt.trim()
                  ? "cursor-not-allowed bg-gray-600"
                  : "bg-cyan-600 hover:bg-cyan-700"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                className="h-5 w-5 text-white"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </div>
        <ChatInputOptions />
      </div>
    </div>
  );
}
