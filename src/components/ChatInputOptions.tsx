import { useChatStore } from "../stores/useChatStore";

export default function ChatInputOptions() {
  const {
    selectedApi,
    setSelectedApi,
    selectedModel,
    setSelectedModel,
    clearChat,
    selectedChatId,
    chatLoading,
  } = useChatStore();
  const isChatLoading =
    selectedChatId != null ? !!chatLoading[selectedChatId] : false;
  type ApiKey = "claude" | "gemini" | "chatgpt";
  type ModelOption = [string, string];
  const models: Record<ApiKey, ModelOption[]> = {
    // https://platform.openai.com/docs/models
    chatgpt: [
      // Flagship chat models
      ["GPT 4o", "gpt-4o"],
      ["GPT 4.1", "gpt-4.1"],
      ["ChatGPT 4o", "chatgpt-4o-latest"],

      // Cost-optimized models
      ["GPT 4o Mini", "gpt-4o-mini"],
      ["GPT 4.1 Nano", "gpt-4.1-nano"],
      ["GPT 4.1 Mini", "gpt-4.1-mini"],

      // Reasoning models (o1, o3, o4 series)
      ["O1 Mini", "o1-mini"],
      ["O1 Preview", "o1-preview"],
      ["O1", "o1"],
      ["O1 Pro", "o1-pro"],
      ["O3 Mini", "o3-mini"],
      ["O3", "o3"],
      ["O4 Mini", "o4-mini"],
    ],
    // https://docs.anthropic.com/en/docs/about-claude/model-deprecations
    claude: [
      ["Claude 3 Haiku", "claude-3-haiku-20240307"],
      ["Claude 3.5 Sonnet (Old)", "claude-3-5-sonnet-20240620"],
      ["Claude 3.5 Haiku", "claude-3-5-haiku-20241022"],
      ["Claude 3.5 Sonnet (New)", "claude-3-5-sonnet-20241022"],
      ["Claude 3.7 Sonnet", "claude-3-7-sonnet-20250219"],
      ["Claude Sonnet 4", "claude-sonnet-4-20250514"],
      ["Claude Opus 4", "claude-opus-4-20250514"],
    ],
    // https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions
    gemini: [
      ["Gemini 2.0 Flash Lite", "gemini-2.0-flash-lite"],
      ["Gemini 2.0 Flash", "gemini-2.0-flash"],
      ["Gemini 2.5 Flash", "gemini-2.5-flash-latest"],
      ["Gemini 2.5 Pro", "gemini-2.5-pro-latest"],
    ],
  };

  // Check if key exists in models object
  const isValidSelectedApi = (api: string): api is ApiKey => {
    return (models as any)[api] !== undefined;
  };

  const currentModels = isValidSelectedApi(selectedApi)
    ? models[selectedApi]
    : [];

  return (
    <div className="mt-2 flex items-center space-x-4">
      {/* API selector */}
      <div className="flex items-center space-x-1">
        <label htmlFor="api-type" className="text-gray-300">
          API:
        </label>
        <select
          id="api-type"
          value={selectedApi}
          onChange={(e) =>
            setSelectedApi(e.target.value as "chatgpt" | "claude" | "gemini")
          }
          disabled={isChatLoading}
          className="w-40 rounded-md border border-gray-600 bg-gray-700 px-2 py-1 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="chatgpt">ChatGPT</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>

      {/* Model selector */}
      <div className="flex items-center space-x-1">
        <label htmlFor="model" className="text-gray-300">
          Model:
        </label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isChatLoading}
          className="w-52 rounded-md border border-gray-600 bg-gray-700 px-2 py-1 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {currentModels.map(([displayName, value]) => (
            <option key={value} value={value}>
              {displayName}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center space-x-1">
        {/* Clear chat*/}
        <button
          className="rounded-md bg-cyan-600 px-10 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
          onClick={clearChat}
          disabled={isChatLoading}
        >
          Clear Chat
        </button>
      </div>
    </div>
  );
}
