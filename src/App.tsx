import { useEffect, useState } from "react";
import { useSettingsStore } from "./stores/useSettingsStore.tsx";
import { useChatStore } from "./stores/useChatStore.tsx";
import SettingsInterface from "./components/SettingsInterface.tsx";
import ChatInterface from "./components/ChatInterface.tsx";
import Modal from "./components/Modal.tsx";
import Sidebar from "./components/Sidebar.tsx";
import { enableMapSet } from "immer";
import ChatInput from "./components/ChatInput.tsx";

// Enable immer produce map and Set
enableMapSet();

function App() {
  // State for switching screens
  const [activeScreen, setActiveScreen] = useState<"chat" | "settings">("chat");

  const { createChat, listChats } = useChatStore();

  // Pull state and actions from stores
  const {
    isKeysLoading: isKeysLoading,
    error: keyFetchError,
    loadKeys,
  } = useSettingsStore();
  const { error: chatError, setError: setChatError } = useChatStore();

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>("");

  // State for sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Add chat
  const handleAddChat = () => {
    setActiveScreen("chat");
    createChat();
  };

  // Load keys on initial app mount
  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  // List chats
  useEffect(() => {
    listChats();
  }, [listChats]);

  // Effect to show modal on new chat error
  useEffect(() => {
    if (chatError) {
      setModalMessage(chatError);
      setIsModalOpen(true);
    }
  }, [chatError]);

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage("");
    setChatError(null); // Clear the error in the store
  };

  // Render a loading screen while keys are being fetched
  if (isKeysLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-gray-200">
        Loading API keys...
      </div>
    );
  }

  // Render an error screen if keys failed to load
  if (keyFetchError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-900 text-red-500">
        <h1>Error loading API keys</h1>
        <p>{keyFetchError}</p>
        <p className="mt-2 text-gray-400">
          Please ensure your backend is configured correctly and restart the
          app.
        </p>
      </div>
    );
  }

  // Main application UI
  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((o) => !o)}
        onAddChat={handleAddChat}
        onSelectChatScreen={() => setActiveScreen("chat")}
        onOpenSettings={() => setActiveScreen("settings")}
      />

      {/* Main Content Area */}
      <div
        className={`${isSidebarOpen ? "ml-80" : "ml-16"} flex min-h-0 flex-1 flex-col duration-200`}
      >
        {activeScreen === "chat" ? <ChatInterface /> : <SettingsInterface />}
      </div>
      {/* TODO: This should be inside ChatInterface, but because of the way "css:fixed" work is outside */}
      {activeScreen === "chat" && <ChatInput isSidebarOpen={isSidebarOpen} />}

      <Modal isOpen={isModalOpen} message={modalMessage} onClose={closeModal} />
    </div>
  );
}

export default App;
