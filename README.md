# Echo: LLM Chat

Echo is a lightweight, cross-platform desktop chat application built with Tauri and React. It connects seamlessly to several Large Language Model (LLM) APIs, providing you with an intuitive interface to converse directly with language models right from your desktop.

## Running the Application

To get Echo up and running on your computer, follow these steps:

### Prerequisites

Ensure you have the following installed:

- **Node.js** (LTS recommended)
- **Rust** (Install via [rustup.rs](https://rustup.rs/))
- **Tauri Prerequisites:** Depending on your operating system, you might need additional build tools. Please refer to the official Tauri documentation for detailed prerequisites: [Tauri Prerequisites Guide](https://v2.tauri.app/start/prerequisites/) (e.g., C++ build tools on Windows, `webkit2gtk` on Linux, Xcode on macOS).

### Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kokosha/echo.git
    cd echo
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run in development mode:**
    ```bash
    npm run tauri dev
    ```
    This command will open the Echo application in a development window with hot-reloading for both frontend (React) and backend (Rust) changes. You'll also see development logs in your terminal.

### Building for Production

To create a distributable installer or application bundle for your operating system:

1.  **Install dependencies (if you haven't already):**
    ```bash
    npm install
    ```
2.  **Build the application:**
    ```bash
    npm run tauri build
    ```
    This command will compile the Rust backend, build your React frontend, and then package the application into an installer (e.g., `.msi` or `.exe` on Windows, `.dmg` on macOS, `.deb` / `.AppImage` on Linux) in the `src-tauri/target/release/bundle` directory. The specific output format depends on your operating system and Tauri configuration.

## License

This project is licensed under the MIT License.
