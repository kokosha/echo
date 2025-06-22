---
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---
## [0.1.0] - 2025-06-22

### Added

- **Chat Management:** Users can now create, view, and remove chats directly from the sidebar.
- **LLM Integration:** Implemented functionality to send messages to various Large Language Model (LLM) APIs, including ChatGPT, Claude, and Gemini.
- **Persistent Messaging:** Messages are now saved in an internal database, ensuring conversation history is retained.
- **Enhanced Message Formatting:**
    - Added comprehensive Markdown support for messages.
    - Added code snippet support within Markdown, featuring a convenient copy-to-clipboard function.
    - Added LaTeX support for mathematical and scientific notations, recognizing both inline (`$`) and display (`$$`) delimiters.
- **Settings Panel:** A new settings section has been added to the sidebar, allowing for future configuration options.
- **Secure API Key Storage:** LLM API keys are now securely stored in a `.env` file.