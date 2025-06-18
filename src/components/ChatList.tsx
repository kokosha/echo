import { Chat, useChatStore } from "../stores/useChatStore";
import React, { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

const ChatListItem = React.memo(function ChatListItem({
  chat,
  isActive,
  onSelectChatScreen,
}: {
  chat: Chat;
  isActive: boolean;
  onSelectChatScreen: () => void;
}) {
  const { selectChat, deleteChat } = useChatStore(
    useShallow((state) => ({
      selectChat: state.selectChat,
      deleteChat: state.deleteChat,
    })),
  );

  const handleSelect = useCallback(() => {
    selectChat(chat.id);
    onSelectChatScreen();
  }, [selectChat, chat.id, onSelectChatScreen]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteChat(chat.id);
    },
    [deleteChat, chat.id],
  );

  return (
    <div key={chat.id} className="relative">
      <button
        onClick={handleSelect}
        className={`flex w-full items-center justify-between rounded-lg px-4 py-3 ${
          isActive ? "bg-gray-300 text-black" : "text-black hover:bg-gray-100"
        }`}
      >
        <span>
          Chat {chat.id} {chat.name && `(${chat.name})`}
        </span>
        <span
          role="button"
          onClick={handleDelete}
          className="font-bold text-black hover:text-red-600"
          aria-label="Delete chat"
        >
          &times;
        </span>
      </button>
    </div>
  );
});

export default function ChatList({
  onSelectChatScreen,
}: {
  onSelectChatScreen: () => void;
}) {
  const { chatIds, chats, activeChatId } = useChatStore(
    useShallow((state) => ({
      chatIds: state.chatIds,
      chats: state.chats,
      activeChatId: state.selectedChatId,
    })),
  );
  return (
    <>
      {chatIds.map((id) => {
        const chat = chats.get(id);
        if (!chat) {
          return null;
        }
        return (
          <ChatListItem
            key={id}
            chat={chat}
            isActive={activeChatId === chat.id}
            onSelectChatScreen={onSelectChatScreen}
          />
        );
      })}
    </>
  );
}
