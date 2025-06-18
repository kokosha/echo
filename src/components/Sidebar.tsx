import { useEffect, useState } from "react";
import ChatList from "./ChatList";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "../stores/useChatStore";

export interface SidebarProps {
  isSidebarOpen: boolean;
  onToggle: () => void;
  onAddChat: () => void;
  onSelectChatScreen: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  isSidebarOpen,
  onToggle,
  onAddChat,
  onSelectChatScreen,
  onOpenSettings,
}: SidebarProps) {
  const [showContent, setShowContent] = useState(isSidebarOpen);
  const { chats } = useChatStore(
    useShallow((state) => ({
      chats: state.chats,
    })),
  );
  const hasChats = chats.size > 0;
  useEffect(() => {
    if (!isSidebarOpen) {
      setShowContent(false);
    } else {
      const timer = window.setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isSidebarOpen]);

  function ToggleButton() {
    return (
      <button
        onClick={onToggle}
        className="text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <title>{isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              isSidebarOpen
                ? "M4 6h16M4 12h16M13 18h7"
                : "M4 6h16M4 12h16M4 18h7"
            }
          />
        </svg>
      </button>
    );
  }

  return (
    <aside
      className={
        `transition-width fixed inset-y-0 left-0 z-20 flex flex-col overflow-hidden bg-white shadow-lg duration-200 ` +
        (isSidebarOpen ? "w-80" : "w-16")
      }
      aria-expanded={isSidebarOpen}
    >
      {isSidebarOpen ? (
        <div className="flex h-full flex-col">
          {/* Toggle Button */}
          <div className="flex justify-end p-4">
            <ToggleButton />
          </div>

          {/* New Chat + ChatList */}
          {showContent && (
            <>
              <div className="flex-1 overflow-y-auto p-4 pt-0">
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={onAddChat}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-gray-100"
                  >
                    {/* Plus Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 flex-shrink-0 font-bold text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span className="bold text-xl font-bold text-gray-800">
                      New Chat
                    </span>
                  </button>
                  {hasChats && (
                    <>
                      <h2 className="mb-2 p-2 px-4 text-lg font-bold text-gray-700">
                        Recent Chats
                      </h2>
                    </>
                  )}
                </div>
                <ChatList onSelectChatScreen={onSelectChatScreen} />
              </div>

              {/* Settings*/}
              <div className="border-t p-4">
                <button
                  onClick={onOpenSettings}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  {/* Settings Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 64 64"
                    fill="currentColor"
                  >
                    {/* Center everything at (32,32) */}
                    <g transform="translate(32,32)">
                      {/* Gear hub */}
                      <circle cx="0" cy="0" r="10" />

                      {/* Define a single tooth with bigger outer tip */}
                      <g id="tooth">
                        {/* Outer tip */}
                        <rect x="-3" y="-30" width="6" height="10" rx="1" />
                        {/* Base pad */}
                        <rect x="-4" y="-20" width="8" height="3" rx="1" />
                      </g>

                      {/* Use that tooth 12 times around the circle */}
                      {[
                        0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
                      ].map((angle) => (
                        <use
                          key={angle}
                          href="#tooth"
                          transform={`rotate(${angle})`}
                        />
                      ))}
                    </g>
                  </svg>
                  <span className="text-xl font-bold text-gray-800">
                    Settings
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex h-full flex-col items-center p-4">
          <ToggleButton />
        </div>
      )}
    </aside>
  );
}
