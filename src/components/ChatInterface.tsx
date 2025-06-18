import ChatDisplay from "./ChatDisplay.tsx";

// Define the types for a single message for passing to ChatDisplay

function ChatInterface() {
  return (
    <div className="flex min-h-0 flex-1 flex-col border border-gray-700 bg-gray-800 p-6">
      <h2 className="mb-4 ml-4 pb-4 text-3xl font-bold text-cyan-300">Echo</h2>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-56">
        <ChatDisplay />
      </div>
    </div>
  );
}

export default ChatInterface;
