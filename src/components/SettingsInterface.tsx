import { memo, useState } from "react";
import { useSettingsStore } from "../stores/useSettingsStore"; // Import the store

// Helper components for icons can be defined outside the main component
const EyeIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
));

const EyeOffIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .69l2.23 2.23c.57-.23 1.18-.36 1.83-.36zm-4.29 2.29l1.52 1.52c-.17.52-.23 1.07-.23 1.64 0 2.76 2.24 5 5 5 .57 0 1.12-.06 1.64-.23l1.52 1.52c-.71.36-1.48.56-2.29.56-2.76 0-5-2.24-5-5 0-.81.2-1.58.56-2.29zM1 4.27l2.28 2.28.46.46C2.12 8.44 1.11 10.1 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 21 21 19.73 2.27 3 1 4.27z" />
  </svg>
));

type ApiKey = "claude" | "gemini" | "chatgpt";
const apiKeyConfigs: {
  name: ApiKey;
  label: string;
  extra: string;
  placeholder: string;
}[] = [
  {
    name: "claude",
    label: "Claude API Key",
    extra: "(Anthropic):",
    placeholder: "Enter your Claude API Key",
  },
  {
    name: "gemini",
    label: "Gemini API Key",
    extra: "(Google AI Studio):",
    placeholder: "Enter your Gemini API Key",
  },
  {
    name: "chatgpt",
    label: "ChatGPT API Key",
    extra: "(OpenAI):",
    placeholder: "Enter your ChatGPT API Key",
  },
];

function Settings() {
  const { tokens, shouldSave, setTokens, toggleShouldSave, saveKeys } =
    useSettingsStore();

  // Consolidated state object for toggling visibility of API keys
  const [showKeys, setShowKeys] = useState({
    claude: false,
    gemini: false,
    chatgpt: false,
  });

  // Function to toggle the visibility of a specific API key
  const toggleShowKey = (keyName: ApiKey) => {
    setShowKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  return (
    <div className="h-full border border-gray-700 bg-gray-800 p-6 shadow-xl">
      <h2 className="mb-4 ml-4 text-3xl font-bold text-cyan-300">Settings</h2>
      <p className="mb-6 ml-4 text-sm text-gray-400">
        Enter your API keys below. They are required to interact with the
        models. Remember to not expose the .env file.
      </p>

      <div className="mb-4 ml-4 space-y-4">
        {/* Map over the API key configurations to generate input fields */}
        {apiKeyConfigs.map(({ name, label, extra, placeholder }) => (
          <div className="flex items-center" key={name}>
            <span className="mr-4 w-48 text-gray-300">
              {label}
              <br />
              {extra}
            </span>
            <div className="relative flex-grow">
              <input
                type={showKeys[name as ApiKey] ? "text" : "password"}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 pr-12 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={tokens[name as ApiKey]}
                onChange={(e) => setTokens(name as ApiKey, e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                onClick={() => toggleShowKey(name as ApiKey)}
                aria-label={`Toggle ${name} key visibility`}
              >
                {showKeys[name as ApiKey] ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save Keys Toggle and Button */}
      <div className="ml-4 mt-6 border-t border-gray-700 pt-6">
        <label className="flex cursor-pointer items-center space-x-3">
          <input
            type="checkbox"
            checked={shouldSave}
            onChange={(e) => toggleShouldSave(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-2 focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-300">
            Save keys for future sessions
          </span>
        </label>
        <p className="ml-7 mt-2 text-xs text-gray-500">
          If enabled, keys will be saved on your device using the Tauri backend.
        </p>
        <div className="mt-6">
          <button
            onClick={saveKeys}
            className="w-full rounded-lg bg-cyan-600 py-3 font-bold text-white transition duration-300 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            disabled={!shouldSave}
          >
            {shouldSave ? "Save Keys" : "Enable to Save Keys"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
