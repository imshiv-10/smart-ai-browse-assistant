# Smart Browse Assistant - Desktop App

Cross-platform desktop application for AI-powered webpage analysis and product comparison.

Built with **Tauri 2.0** (Rust + React + TypeScript).

## Features

- 🔍 **URL Analysis** - Analyze any webpage by entering its URL
- 📝 **AI Summaries** - Get concise, AI-generated summaries of webpage content
- 💬 **Interactive Chat** - Ask questions about the page content
- 🛒 **Product Comparison** - Find and compare product alternatives
- 🌙 **Dark Mode** - Light, dark, and system theme support
- 🖥️ **Native Experience** - Fast, lightweight native app for macOS and Windows

## Prerequisites

### For Development

1. **Node.js** (v18 or later)
   ```bash
   # macOS (using Homebrew)
   brew install node
   
   # Windows (using winget)
   winget install OpenJS.NodeJS
   ```

2. **Rust** (latest stable)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **Platform-specific dependencies**

   **macOS:**
   ```bash
   xcode-select --install
   ```

   **Windows:**
   - Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Select "Desktop development with C++"
   - Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually pre-installed on Windows 10/11)

4. **Backend Server** - Make sure the Python backend is running:
   ```bash
   cd ../backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

## Setup

1. **Install dependencies:**
   ```bash
   cd desktop
   npm install
   ```

2. **Add a dependency for chrono (date handling in Rust):**
   Add to `src-tauri/Cargo.toml`:
   ```toml
   chrono = { version = "0.4", features = ["serde"] }
   ```

## Development

Run the app in development mode with hot-reload:

```bash
npm run tauri:dev
```

This will:
- Start the Vite dev server for the frontend
- Compile the Rust backend
- Launch the desktop app with DevTools

## Building

### Build for Current Platform

```bash
npm run tauri:build
```

### Build for macOS (Universal Binary)

```bash
npm run tauri:build:mac
```

This creates a universal binary that works on both Intel and Apple Silicon Macs.

Output location: `src-tauri/target/release/bundle/`
- `.app` - Application bundle
- `.dmg` - Disk image for distribution

### Build for Windows

```bash
npm run tauri:build:win
```

Output location: `src-tauri/target/release/bundle/`
- `.exe` - Portable executable
- `.msi` - Windows Installer package
- `.nsis` - NSIS installer

## Cross-Compilation

### Building Windows from macOS

1. Add the Windows target:
   ```bash
   rustup target add x86_64-pc-windows-msvc
   ```

2. Install cross-compilation tools:
   ```bash
   brew install mingw-w64
   ```

3. Build:
   ```bash
   npm run tauri:build:win
   ```

### Building macOS from Windows

Cross-compiling for macOS from Windows is not officially supported due to Apple's licensing requirements. Use a macOS machine or CI service.

## CI/CD with GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-toolchain@stable
      - run: cd desktop && npm install
      - run: cd desktop && npm run tauri:build:mac
      - uses: actions/upload-artifact@v4
        with:
          name: macos-build
          path: desktop/src-tauri/target/release/bundle/

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-toolchain@stable
      - run: cd desktop && npm install
      - run: cd desktop && npm run tauri:build:win
      - uses: actions/upload-artifact@v4
        with:
          name: windows-build
          path: desktop/src-tauri/target/release/bundle/
```

## Project Structure

```
desktop/
├── src/                      # React frontend
│   ├── components/           # UI components
│   ├── lib/                  # API client & state management
│   ├── styles/               # CSS styles
│   └── types/                # TypeScript types
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   ├── lib.rs           # App setup
│   │   ├── commands.rs      # Tauri commands (IPC)
│   │   └── scraper.rs       # Web scraping utilities
│   ├── icons/               # App icons
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── package.json             # Node.js dependencies
└── vite.config.ts           # Vite configuration
```

## App Icons

Before building for production, add proper icons:

1. Create a 1024x1024 PNG icon
2. Use Tauri's icon generator:
   ```bash
   npm run tauri icon path/to/icon.png
   ```

This will generate all required icon sizes in `src-tauri/icons/`.

## Configuration

Edit `src-tauri/tauri.conf.json` to customize:

- **productName** - Application name
- **identifier** - Bundle identifier (e.g., `com.yourcompany.app`)
- **windows** - Window size, title, and behavior
- **bundle** - Installer options for each platform

## Troubleshooting

### macOS: "App is damaged and can't be opened"

This happens with unsigned apps. To fix:
```bash
xattr -cr /Applications/Smart\ Browse\ Assistant.app
```

### Windows: WebView2 not found

Install WebView2 from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### Build fails with Rust errors

Make sure Rust is up to date:
```bash
rustup update
```

### Backend connection issues

1. Ensure the backend is running on `http://localhost:8000`
2. Check the Settings panel in the app to configure the backend URL

## License

MIT
