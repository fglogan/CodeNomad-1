# Genesis Console (CodeNomad) - As-Built Design Document

**Version:** 0.5.1  
**Generated:** January 2026  
**Document Type:** Forensic Architecture Analysis

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Package Architecture](#4-package-architecture)
5. [Entry Points & Build Configuration](#5-entry-points--build-configuration)
6. [Server Architecture](#6-server-architecture)
7. [UI Architecture](#7-ui-architecture)
8. [Desktop Applications](#8-desktop-applications)
9. [Data Flow & Wiring](#9-data-flow--wiring)
10. [Data Dictionary](#10-data-dictionary)
11. [API Reference](#11-api-reference)
12. [Architecture Diagrams](#12-architecture-diagrams)

---

## 1. Executive Summary

Genesis Console (forked from CodeNomad) is a multi-workspace AI coding assistant manager that orchestrates multiple OpenCode CLI instances through a unified web interface. The application supports three deployment modes:

1. **Web Mode** - Standalone HTTP server serving the UI
2. **Electron Mode** - Desktop app wrapping server and UI
3. **Tauri Mode** - Lightweight desktop app (Rust-based)

### Core Capabilities

- Multi-workspace management (run multiple OpenCode instances simultaneously)
- Real-time streaming of AI responses via SSE
- Background shell process management
- MCP (Model Context Protocol) server integration
- LSP (Language Server Protocol) status monitoring
- Session forking and history management
- Customizable binary paths for different OpenCode versions

---

## 2. Technology Stack

### Frontend (UI Package)

| Technology | Version | Purpose |
|------------|---------|---------|
| SolidJS | 1.8.0 | Reactive UI framework |
| Vite | 5.x | Build tool and dev server |
| TailwindCSS | 3.x | Utility-first CSS |
| TypeScript | 5.3+ | Type safety |
| Shiki | 3.13.0 | Syntax highlighting |
| Marked | 12.0.0 | Markdown parsing |
| Kobalte | 0.13.11 | Headless UI components |
| Lucide Solid | 0.300.0 | Icons |

### Backend (Server Package)

| Technology | Version | Purpose |
|------------|---------|---------|
| Fastify | 4.28.1 | HTTP server framework |
| TypeScript | 5.6.3 | Type safety |
| Zod | 3.23.8 | Runtime schema validation |
| Pino | 9.4.0 | Structured logging |
| Commander | 12.1.0 | CLI argument parsing |

### Desktop (Electron)

| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 39.0.0 | Desktop wrapper |
| electron-vite | 4.0.1 | Build tooling |
| electron-builder | 24.x | Distribution packaging |

### Desktop (Tauri)

| Technology | Version | Purpose |
|------------|---------|---------|
| Tauri | 2.x | Lightweight desktop wrapper |
| Rust | stable | Native backend |

### SDK Integration

| Package | Version | Purpose |
|---------|---------|---------|
| @opencode-ai/sdk | 1.1.1 | OpenCode API client |
| @opencode-ai/plugin | 1.1.1 | Plugin development kit |

---

## 3. Directory Structure

```
CodeNomad/
├── package.json                    # Workspace root configuration
├── package-lock.json
│
├── docs/                           # Documentation
│   └── screenshots/
│
├── packages/
│   ├── server/                     # @neuralnomads/codenomad
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── scripts/
│   │   │   ├── copy-ui-dist.mjs    # Post-build: copy UI to public/
│   │   │   └── copy-opencode-config.mjs
│   │   ├── public/                 # Built UI assets (generated)
│   │   │   ├── index.html
│   │   │   ├── loading.html
│   │   │   └── assets/
│   │   └── src/
│   │       ├── index.ts            # Main entry point
│   │       ├── bin.ts              # Binary entry for distribution
│   │       ├── api-types.ts        # Shared type definitions
│   │       ├── logger.ts           # Pino logger configuration
│   │       ├── loader.ts           # Module loading utilities
│   │       ├── launcher.ts         # Browser launch helper
│   │       ├── opencode-config.ts  # OpenCode config resolution
│   │       ├── config/
│   │       │   ├── schema.ts       # Zod schemas for config
│   │       │   ├── store.ts        # Config persistence
│   │       │   └── binaries.ts     # Binary registry
│   │       ├── events/
│   │       │   └── bus.ts          # EventEmitter-based event bus
│   │       ├── filesystem/
│   │       │   ├── browser.ts      # Directory browsing
│   │       │   ├── search.ts       # File search
│   │       │   └── search-cache.ts # Search result caching
│   │       ├── server/
│   │       │   ├── http-server.ts  # Fastify server setup
│   │       │   └── routes/
│   │       │       ├── workspaces.ts    # /api/workspaces
│   │       │       ├── config.ts        # /api/config
│   │       │       ├── filesystem.ts    # /api/filesystem
│   │       │       ├── events.ts        # /api/events (SSE)
│   │       │       ├── storage.ts       # /api/storage
│   │       │       ├── meta.ts          # /api/meta
│   │       │       ├── plugin.ts        # /workspaces/:id/plugin
│   │       │       └── background-processes.ts
│   │       ├── storage/
│   │       │   └── instance-store.ts    # Per-instance data persistence
│   │       ├── workspaces/
│   │       │   ├── manager.ts           # Workspace lifecycle
│   │       │   ├── runtime.ts           # OpenCode process spawning
│   │       │   └── instance-events.ts   # Instance SSE bridge
│   │       ├── plugins/
│   │       │   ├── channel.ts           # Plugin communication
│   │       │   └── handlers.ts          # Plugin event handlers
│   │       ├── background-processes/
│   │       │   └── manager.ts           # Shell process management
│   │       └── releases/
│   │           └── release-monitor.ts   # Update checking
│   │
│   ├── ui/                         # @codenomad/ui
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts          # Vite build configuration
│   │   └── src/
│   │       ├── main.tsx            # Application entry
│   │       ├── App.tsx             # Root component
│   │       ├── index.css           # Global styles
│   │       ├── renderer/
│   │       │   ├── index.html      # Main HTML template
│   │       │   ├── loading.html    # Loading screen template
│   │       │   ├── main.tsx        # Renderer entry
│   │       │   └── loading/
│   │       │       ├── main.tsx    # Loading screen component
│   │       │       └── loading.css
│   │       ├── components/
│   │       │   ├── folder-selection-view.tsx
│   │       │   ├── message-section.tsx
│   │       │   ├── prompt-input.tsx
│   │       │   ├── tool-call.tsx
│   │       │   ├── instance/
│   │       │   │   └── instance-shell2.tsx
│   │       │   ├── session/
│   │       │   │   ├── session-view.tsx
│   │       │   │   └── context-usage-panel.tsx
│   │       │   └── tool-call/
│   │       │       └── renderers/
│   │       │           ├── bash.tsx
│   │       │           ├── edit.tsx
│   │       │           ├── read.tsx
│   │       │           └── ...
│   │       ├── stores/
│   │       │   ├── preferences.tsx      # User preferences
│   │       │   ├── instances.ts         # Instance management
│   │       │   ├── sessions.ts          # Session orchestration
│   │       │   ├── session-state.ts     # Session signals
│   │       │   ├── session-actions.ts   # Session mutations
│   │       │   ├── ui.ts                # UI state
│   │       │   ├── background-processes.ts
│   │       │   └── message-v2/
│   │       │       ├── instance-store.ts
│   │       │       ├── bus.ts
│   │       │       ├── bridge.ts
│   │       │       └── types.ts
│   │       ├── lib/
│   │       │   ├── api-client.ts        # Server API client
│   │       │   ├── opencode-api.ts      # OpenCode SDK utilities
│   │       │   ├── sdk-manager.ts       # SDK client management
│   │       │   ├── sse-manager.ts       # SSE event handling
│   │       │   ├── server-events.ts     # Server event bus
│   │       │   ├── runtime-env.ts       # Environment detection
│   │       │   ├── native/
│   │       │   │   ├── native-functions.ts
│   │       │   │   ├── electron/functions.ts
│   │       │   │   └── tauri/functions.ts
│   │       │   ├── hooks/
│   │       │   └── shortcuts/
│   │       ├── styles/
│   │       │   ├── tokens.css
│   │       │   ├── components/
│   │       │   ├── messaging/
│   │       │   └── panels/
│   │       └── types/
│   │           ├── instance.ts
│   │           ├── session.ts
│   │           ├── message.ts
│   │           └── permission.ts
│   │
│   ├── electron-app/               # @neuralnomads/codenomad-electron-app
│   │   ├── package.json
│   │   ├── electron.vite.config.ts
│   │   └── electron/
│   │       └── main/
│   │           ├── main.ts         # Main process entry
│   │           ├── ipc.ts          # IPC handlers
│   │           ├── process-manager.ts
│   │           ├── menu.ts
│   │           └── storage.ts
│   │
│   ├── tauri-app/                  # @codenomad/tauri-app
│   │   ├── package.json
│   │   └── src-tauri/
│   │       ├── tauri.conf.json
│   │       ├── Cargo.toml
│   │       └── src/
│   │           ├── main.rs
│   │           └── cli_manager.rs
│   │
│   └── opencode-config/            # OpenCode plugin package
│       ├── package.json
│       └── plugin/
│           ├── codenomad.ts        # Plugin entry
│           └── lib/
│               ├── client.ts       # Server communication
│               └── background-process.ts
│
└── .opencode/                      # OpenCode workspace config
    └── package.json
```

---

## 4. Package Architecture

### Workspace Configuration (Root `package.json`)

```json
{
  "name": "codenomad-workspace",
  "version": "0.5.1",
  "workspaces": {
    "packages": [
      "packages/server",
      "packages/ui",
      "packages/electron-app",
      "packages/tauri-app"
    ]
  }
}
```

### Package Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                     codenomad-workspace                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │ @codenomad/ui   │────▶│ @neuralnomads/codenomad         │   │
│  │ (UI Package)    │     │ (Server Package)                 │   │
│  └─────────────────┘     └─────────────────────────────────┘   │
│          │                           │                          │
│          │                           │                          │
│          ▼                           ▼                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           @neuralnomads/codenomad-electron-app          │   │
│  │                    (Electron App)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                @codenomad/tauri-app                      │   │
│  │                    (Tauri App)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              opencode-config (Plugin)                    │   │
│  │          Bundled with server for OpenCode               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Entry Points & Build Configuration

### Server Entry Points

| File | Purpose | Execution |
|------|---------|-----------|
| `src/index.ts` | Development entry | `tsx src/index.ts` |
| `src/bin.ts` | Production entry | `node dist/bin.js` |

### UI Entry Points

| File | Purpose | Build Target |
|------|---------|--------------|
| `src/renderer/index.html` | Main app HTML | `dist/index.html` |
| `src/renderer/loading.html` | Loading screen | `dist/loading.html` |
| `src/renderer/main.tsx` | Main app JS entry | `dist/assets/main-*.js` |
| `src/renderer/loading/main.tsx` | Loading screen JS | `dist/assets/loading-*.js` |

### Vite Configuration (`packages/ui/vite.config.ts`)

```typescript
export default defineConfig({
  root: "./src/renderer",
  plugins: [solid()],
  resolve: {
    alias: { "@": "./src" }
  },
  server: { port: 3000 },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "./src/renderer/index.html",
        loading: "./src/renderer/loading.html"
      }
    }
  }
})
```

### Build Pipeline

```
npm run build --workspace @neuralnomads/codenomad
    │
    ├─► npm run build:ui          # Build UI package
    │       └─► vite build        # Output: packages/ui/src/renderer/dist/
    │
    ├─► npm run prepare-ui        # Copy UI to server
    │       └─► copy-ui-dist.mjs  # Copy to: packages/server/public/
    │
    ├─► tsc -p tsconfig.json      # Compile server TypeScript
    │                             # Output: packages/server/dist/
    │
    └─► npm run prepare-config    # Copy OpenCode plugin config
            └─► copy-opencode-config.mjs
                                  # Copy to: packages/server/dist/opencode-config/
```

---

## 6. Server Architecture

### Startup Sequence

```
CLI Arguments (Commander)
    │
    ├── --host (default: 127.0.0.1)
    ├── --port (default: 9898, Genesis uses 8888)
    ├── --workspace-root (default: cwd)
    ├── --unrestricted-root (boolean)
    ├── --config (~/.config/codenomad/config.json)
    ├── --log-level / --log-destination
    └── --launch (auto-open browser)
    │
    ▼
main()
    │
    ├── Initialize Logger (Pino)
    ├── Create EventBus
    ├── Create ConfigStore (Zod validation)
    ├── Create BinaryRegistry
    ├── Create WorkspaceManager
    ├── Create FileSystemBrowser
    ├── Create InstanceStore
    ├── Create InstanceEventBridge
    ├── Create ReleaseMonitor
    ├── Create BackgroundProcessManager
    │
    ├── Create HTTP Server (Fastify)
    │   ├── Register CORS middleware
    │   ├── Register @fastify/reply-from (proxy)
    │   ├── Register @fastify/static (UI serving)
    │   └── Register all route handlers
    │
    ├── Start listening on port
    │
    └── Setup shutdown handlers (SIGINT/SIGTERM)
```

### Core Services

| Service | File | Responsibility |
|---------|------|----------------|
| `EventBus` | `events/bus.ts` | Pub/sub event distribution |
| `ConfigStore` | `config/store.ts` | User configuration persistence |
| `BinaryRegistry` | `config/binaries.ts` | OpenCode binary management |
| `WorkspaceManager` | `workspaces/manager.ts` | Workspace lifecycle |
| `WorkspaceRuntime` | `workspaces/runtime.ts` | Process spawning |
| `FileSystemBrowser` | `filesystem/browser.ts` | Directory listing |
| `InstanceStore` | `storage/instance-store.ts` | Per-instance data |
| `InstanceEventBridge` | `workspaces/instance-events.ts` | OpenCode SSE proxy |
| `ReleaseMonitor` | `releases/release-monitor.ts` | Update checking |
| `BackgroundProcessManager` | `background-processes/manager.ts` | Shell processes |
| `PluginChannelManager` | `plugins/channel.ts` | Plugin communication |

### Workspace Lifecycle

```
create(folder, binaryId)
    │
    ├── Generate unique ID (timestamp base36)
    ├── Resolve binary path from BinaryRegistry
    ├── Create WorkspaceRecord { status: "starting" }
    ├── Emit "workspace.created" event
    │
    ├── Build environment variables:
    │   ├── User-defined vars from preferences
    │   ├── OPENCODE_CONFIG_DIR → plugin config path
    │   ├── CODENOMAD_INSTANCE_ID → workspace ID
    │   └── CODENOMAD_BASE_URL → server base URL
    │
    ├── Call runtime.launch()
    │   └── Spawn: `{binary} serve --port 0 --print-logs --log-level DEBUG`
    │
    ├── Wait for port detection (stdout parsing)
    │   └── Regex: "opencode server listening on http://.+:(\d+)"
    │
    ├── Wait for health check (GET /project/current)
    ├── Stability delay (1500ms)
    │
    ├── Update record { status: "ready", pid, port }
    └── Emit "workspace.started" event
```

---

## 7. UI Architecture

### Provider Hierarchy

```tsx
<ConfigProvider>                    // User preferences
  <InstanceConfigProvider>          // Per-instance config (model selections)
    <ThemeProvider>                 // Theme management
      <App />                       // Main application
    </ThemeProvider>
  </InstanceConfigProvider>
</ConfigProvider>
```

### Component Tree

```
App.tsx
├── AlertDialog (global confirm dialogs)
├── InstanceDisconnectedModal
├── Toaster (notifications)
├── RemoteAccessOverlay (QR code for mobile)
│
├── [No Instances] ──────────────────────────────────────────┐
│   └── FolderSelectionView                                  │
│       ├── GenesisLogo (branded header)                     │
│       ├── RecentFolders List (keyboard navigable)          │
│       ├── DirectoryBrowserDialog                           │
│       └── AdvancedSettingsModal                            │
│                                                            │
└── [Has Instances] ─────────────────────────────────────────┤
    ├── InstanceTabs (tab bar for switching)                 │
    └── For each Instance:                                   │
        └── InstanceMetadataProvider                         │
            └── InstanceShell2 (main layout shell)           │
                ├── AppBar / Toolbar                         │
                │   ├── Token Usage Display                  │
                │   ├── Command Palette Button               │
                │   └── Connection Status                    │
                │                                            │
                ├── Left Drawer (collapsible)                │
                │   ├── SessionList                          │
                │   ├── ContextUsagePanel                    │
                │   ├── AgentSelector                        │
                │   └── ModelSelector                        │
                │                                            │
                ├── Main Content Area                        │
                │   └── SessionView                          │
                │       ├── MessageSection                   │
                │       │   ├── MessageBlockList             │
                │       │   │   └── MessageBlock             │
                │       │   │       └── MessagePart          │
                │       │   │           └── ToolCall         │
                │       │   └── MessageTimeline              │
                │       └── PromptInput                      │
                │                                            │
                ├── Right Drawer (collapsible)               │
                │   ├── Plan (Todo list)                     │
                │   ├── Background Shells                    │
                │   ├── MCP Servers Status                   │
                │   ├── LSP Servers Status                   │
                │   └── Plugins Status                       │
                │                                            │
                └── CommandPalette                           │
```

### State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Stores                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  preferences.tsx ──────► User settings, theme, recent folders   │
│                                                                  │
│  instances.ts ─────────► Active OpenCode instances              │
│       │                  Maps: instanceId → Instance            │
│       │                                                          │
│       ├── session-state.ts ──► Sessions per instance            │
│       │       │                Maps: instanceId → sessionId → Session
│       │       │                                                  │
│       │       ├── session-actions.ts ──► Mutations (send, abort)│
│       │       ├── session-events.ts ───► SSE event handlers     │
│       │       └── session-models.ts ───► Model/provider utils   │
│       │                                                          │
│       └── message-v2/                                            │
│               │                                                  │
│               ├── instance-store.ts ──► Normalized messages     │
│               │       │                per instance              │
│               │       │                                          │
│               │       ├── Messages: Record<id, MessageRecord>   │
│               │       ├── Sessions: Record<id, SessionRecord>   │
│               │       ├── Parts: Nested in messages             │
│               │       ├── Permissions: Queue + active           │
│               │       └── Usage: Token tracking                 │
│               │                                                  │
│               ├── bus.ts ─────────► Store registry              │
│               └── bridge.ts ──────► Event → Store updates       │
│                                                                  │
│  ui.ts ────────────────► UI state (drawers, tabs, selection)    │
│  background-processes.ts ► Shell process tracking               │
│  attachments.ts ───────► File/image attachments per session     │
│  alerts.ts ────────────► Confirm dialog queue                   │
│  command-palette.ts ───► Palette open state                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Desktop Applications

### Electron App Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Electron Main Process                       │
├─────────────────────────────────────────────────────────────────┤
│  main.ts                                                         │
│    │                                                             │
│    ├── app.whenReady()                                           │
│    │   ├── startCli() ──────► Spawn CodeNomad server            │
│    │   └── createWindow() ──► BrowserWindow with loading.html   │
│    │                                                             │
│    ├── cliManager events:                                        │
│    │   ├── "ready" ──► Navigate to server URL                   │
│    │   └── "error" ──► Show error in loading screen             │
│    │                                                             │
│    └── IPC handlers (ipc.ts):                                    │
│        ├── cli:getStatus ──► Return CLI status                  │
│        ├── cli:restart ───► Stop and restart CLI                │
│        └── dialog:open ───► Native file dialog                  │
│                                                                  │
│  process-manager.ts                                              │
│    │                                                             │
│    ├── State machine: stopped → starting → ready | error        │
│    │                                                             │
│    ├── Spawn: node bin.js serve --host 127.0.0.1 --port 0       │
│    │                                                             │
│    └── Port detection via stdout parsing                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ IPC Bridge
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Electron Renderer Process                     │
├─────────────────────────────────────────────────────────────────┤
│  preload.cjs (context bridge)                                    │
│    │                                                             │
│    └── Exposes: window.electronAPI                              │
│        ├── getCliStatus()                                        │
│        ├── restartCli()                                          │
│        ├── openDialog(options)                                   │
│        └── onMenuEvent(callback)                                 │
│                                                                  │
│  UI Package (loaded from server URL)                             │
│    │                                                             │
│    └── Detects Electron via runtime-env.ts                      │
│        └── Uses native dialogs when available                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tauri App Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tauri (Rust)                              │
├─────────────────────────────────────────────────────────────────┤
│  main.rs                                                         │
│    │                                                             │
│    ├── tauri::Builder::default()                                 │
│    │   ├── plugin(tauri_plugin_dialog)                          │
│    │   ├── plugin(tauri_plugin_opener)                          │
│    │   ├── plugin(navigation_guard) ──► External link handling │
│    │   └── manage(AppState { CliProcessManager })               │
│    │                                                             │
│    ├── setup(|app| {                                             │
│    │   ├── build_menu(&app.handle())                            │
│    │   └── thread::spawn(|| manager.start(...))                 │
│    │ })                                                          │
│    │                                                             │
│    └── invoke_handler([cli_get_status, cli_restart])            │
│                                                                  │
│  cli_manager.rs                                                  │
│    │                                                             │
│    ├── CliState: Starting | Ready | Error | Stopped             │
│    │                                                             │
│    ├── launch()                                                  │
│    │   ├── Unix: spawn via user shell ($SHELL -l -i -c)         │
│    │   └── Windows: direct spawn                                │
│    │                                                             │
│    ├── Port detection via stdout regex                          │
│    │                                                             │
│    └── navigate_main(app, url) ──► Navigate webview             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Tauri Commands
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Webview (UI)                                │
├─────────────────────────────────────────────────────────────────┤
│  window.__TAURI__                                                │
│    │                                                             │
│    ├── invoke("cli_get_status")                                  │
│    ├── invoke("cli_restart")                                     │
│    └── event.listen("cli:ready", ...)                           │
│                                                                  │
│  tauri_plugin_dialog                                             │
│    └── Native file dialogs via Rust API                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Data Flow & Wiring

### HTTP Communication

```
┌─────────────────┐         ┌─────────────────────────────────────┐
│    UI Client    │         │        Genesis Console Server        │
│  (Browser/App)  │         │          (Port 8888)                 │
├─────────────────┤         ├─────────────────────────────────────┤
│                 │         │                                      │
│  serverApi      │ HTTP    │  /api/workspaces                    │
│  ─────────────────────────► POST: Create workspace              │
│                 │         │  GET: List workspaces               │
│                 │         │  DELETE: Stop workspace             │
│                 │         │                                      │
│  serverApi      │ HTTP    │  /api/config                        │
│  ─────────────────────────► GET/PUT: App configuration          │
│                 │         │  /api/config/binaries: Binary mgmt  │
│                 │         │                                      │
│  serverApi      │ HTTP    │  /api/filesystem                    │
│  ─────────────────────────► GET: Directory browsing             │
│                 │         │                                      │
│  serverApi      │ SSE     │  /api/events                        │
│  ◄───────────────────────── workspace.*, config.*, instance.*   │
│                 │         │                                      │
│  SDK Client     │ HTTP    │  /workspaces/:id/instance/*         │
│  ─────────────────────────► Proxied to OpenCode instance        │
│                 │         │                                      │
└─────────────────┘         └─────────────────────────────────────┘
                                          │
                                          │ Proxy
                                          ▼
                            ┌─────────────────────────────────────┐
                            │      OpenCode Instance               │
                            │      (Dynamic Port)                  │
                            ├─────────────────────────────────────┤
                            │  /session/*     Session management   │
                            │  /message/*     Message streaming    │
                            │  /project/*     Project info         │
                            │  /config/*      OpenCode config      │
                            │  /mcp/*         MCP server status    │
                            │  /lsp/*         LSP status           │
                            └─────────────────────────────────────┘
```

### SSE Event Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                        Event Sources                               │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  WorkspaceManager ──────► workspace.created                       │
│                   ──────► workspace.started                       │
│                   ──────► workspace.error                         │
│                   ──────► workspace.stopped                       │
│                                                                    │
│  WorkspaceRuntime ──────► workspace.log                           │
│                                                                    │
│  ConfigStore ───────────► config.appChanged                       │
│  BinaryRegistry ────────► config.binariesChanged                  │
│                                                                    │
│  InstanceStore ─────────► instance.dataChanged                    │
│                                                                    │
│  InstanceEventBridge ───► instance.event (from OpenCode SSE)     │
│                     ───► instance.eventStatus                     │
│                                                                    │
│  ReleaseMonitor ────────► app.releaseAvailable                    │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
                              │
                              │ EventBus.emit()
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                          EventBus                                  │
├───────────────────────────────────────────────────────────────────┤
│  - Extends Node.js EventEmitter                                   │
│  - Tracks SSE client subscriptions                                │
│  - Distributes events to all connected clients                    │
└───────────────────────────────────────────────────────────────────┘
                              │
                              │ SSE Push
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                     /api/events Endpoint                           │
├───────────────────────────────────────────────────────────────────┤
│  Format: data: {"type":"...", ...payload}\n\n                     │
│  Heartbeat: :hb {timestamp}\n\n (every 15s)                       │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                        UI Event Handlers                           │
├───────────────────────────────────────────────────────────────────┤
│  serverEvents.on("workspace.started") ──► instances.ts            │
│  serverEvents.on("instance.event") ─────► sseManager.ts           │
│  sseManager ────────────────────────────► message-v2/bridge.ts    │
│  bridge.ts ─────────────────────────────► instance-store.ts       │
└───────────────────────────────────────────────────────────────────┘
```

### Plugin Communication

```
┌───────────────────────────────────────────────────────────────────┐
│                    OpenCode Instance                               │
│                  (with CodeNomad plugin)                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  plugin/codenomad.ts                                              │
│    │                                                               │
│    ├── Environment Variables:                                      │
│    │   ├── CODENOMAD_INSTANCE_ID                                  │
│    │   └── CODENOMAD_BASE_URL                                     │
│    │                                                               │
│    ├── SSE Connection (input):                                     │
│    │   └── GET /workspaces/:id/plugin/events                      │
│    │       └── Receives: codenomad.ping events                    │
│    │                                                               │
│    ├── Event Posting (output):                                     │
│    │   └── POST /workspaces/:id/plugin/event                      │
│    │       └── Sends: codenomad.pong, status updates              │
│    │                                                               │
│    └── Background Process Tools:                                   │
│        └── REST calls to /workspaces/:id/plugin/background-processes
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 10. Data Dictionary

### Core Entities

#### WorkspaceDescriptor

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (timestamp base36) |
| `path` | string | Absolute path on host filesystem |
| `name` | string? | Display name |
| `status` | `"starting" \| "ready" \| "stopped" \| "error"` | Current state |
| `pid` | number? | Process ID when running |
| `port` | number? | HTTP port when running |
| `proxyPath` | string | URL path prefix for proxying |
| `binaryId` | string | ID of OpenCode binary used |
| `binaryLabel` | string | Display label for binary |
| `binaryVersion` | string? | Detected version |
| `createdAt` | string (ISO) | Creation timestamp |
| `updatedAt` | string (ISO) | Last update timestamp |
| `error` | string? | Error message if status is "error" |

#### Instance (UI)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Matches WorkspaceDescriptor.id |
| `folder` | string | Workspace path |
| `port` | number | Server port |
| `pid` | number | Process ID |
| `proxyPath` | string | Proxy URL path |
| `status` | WorkspaceStatus | Current state |
| `error` | string? | Error message |
| `client` | OpencodeClient \| null | SDK client instance |
| `metadata` | InstanceMetadata? | Project, MCP, LSP info |
| `binaryPath` | string? | Binary used |
| `binaryLabel` | string? | Binary display name |
| `binaryVersion` | string? | Binary version |
| `environmentVariables` | Record<string, string>? | Custom env vars |

#### Session

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique session ID |
| `instanceId` | string | Parent instance |
| `parentId` | string \| null | Parent session (for forks) |
| `agent` | string | Agent name |
| `model` | { providerId, modelId } | Selected model |
| `version` | string | Session version |
| `status` | `"idle" \| "working" \| "compacting"` | Activity state |
| `pendingPermission` | boolean? | Waiting for user approval |

#### MessageRecord

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique message ID |
| `sessionId` | string | Parent session |
| `role` | `"user" \| "assistant"` | Message author |
| `status` | `"sending" \| "sent" \| "streaming" \| "complete" \| "error"` | State |
| `createdAt` | number (timestamp) | Creation time |
| `updatedAt` | number (timestamp) | Last update |
| `revision` | number | Version for reactivity |
| `isEphemeral` | boolean? | Temporary message |
| `partIds` | string[] | Ordered part IDs |
| `parts` | Record<string, NormalizedPartRecord> | Part data by ID |

#### ClientPart (extends SDK Part)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Part identifier |
| `type` | `"text" \| "tool" \| "reasoning" \| "file"` | Part type |
| `sessionID` | string? | Parent session |
| `messageID` | string? | Parent message |
| `synthetic` | boolean? | Generated client-side |
| `renderCache` | RenderCache? | Cached HTML render |
| `pendingPermission` | PendingPermissionState? | Permission state |

#### BackgroundProcess

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Process identifier |
| `workspaceId` | string | Parent workspace |
| `title` | string | Display title |
| `command` | string | Shell command |
| `cwd` | string | Working directory |
| `status` | `"running" \| "stopped" \| "error"` | Process state |
| `pid` | number? | OS process ID |
| `startedAt` | string (ISO) | Start time |
| `stoppedAt` | string? (ISO) | Stop time |
| `exitCode` | number? | Exit code if stopped |
| `outputSizeBytes` | number? | Output buffer size |

### Configuration Entities

#### ConfigFile

| Field | Type | Description |
|-------|------|-------------|
| `preferences` | Preferences | User preferences |
| `recentFolders` | RecentFolder[] | Recently opened folders |
| `opencodeBinaries` | OpenCodeBinary[] | Registered binaries |
| `theme` | `"light" \| "dark" \| "system"` | Color theme |

#### Preferences

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `showThinkingBlocks` | boolean | false | Show reasoning blocks |
| `thinkingBlocksExpansion` | `"expanded" \| "collapsed"` | "expanded" | Default expansion |
| `showTimelineTools` | boolean | true | Show timeline sidebar |
| `lastUsedBinary` | string? | - | Last selected binary |
| `environmentVariables` | Record<string, string> | {} | Custom env vars |
| `modelRecents` | ModelPreference[] | [] | Recent model selections |
| `diffViewMode` | `"split" \| "unified"` | "split" | Diff display mode |
| `toolOutputExpansion` | `"expanded" \| "collapsed"` | "expanded" | Tool output default |
| `diagnosticsExpansion` | `"expanded" \| "collapsed"` | "expanded" | Diagnostics default |
| `showUsageMetrics` | boolean | true | Show token usage |
| `autoCleanupBlankSessions` | boolean | true | Delete empty sessions |
| `listeningMode` | `"local" \| "all"` | "local" | Network binding |

#### BinaryRecord

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `path` | string | Filesystem path to binary |
| `label` | string | Display label |
| `version` | string? | Detected version |
| `isDefault` | boolean | Use for new workspaces |
| `lastValidatedAt` | string? (ISO) | Last validation time |
| `validationError` | string? | Validation error message |

### Event Types

| Event | Payload | Trigger |
|-------|---------|---------|
| `workspace.created` | `{ workspace: WorkspaceDescriptor }` | New workspace |
| `workspace.started` | `{ workspace: WorkspaceDescriptor }` | Workspace ready |
| `workspace.error` | `{ workspace: WorkspaceDescriptor }` | Workspace failed |
| `workspace.stopped` | `{ workspaceId: string }` | Workspace stopped |
| `workspace.log` | `{ entry: WorkspaceLogEntry }` | Log from OpenCode |
| `config.appChanged` | `{ config: AppConfig }` | Config updated |
| `config.binariesChanged` | `{ binaries: BinaryRecord[] }` | Binaries changed |
| `instance.dataChanged` | `{ instanceId, data }` | Instance storage |
| `instance.event` | `{ instanceId, event }` | From OpenCode SSE |
| `instance.eventStatus` | `{ instanceId, status, reason? }` | SSE connection |
| `app.releaseAvailable` | `{ release: LatestReleaseInfo }` | New version |

---

## 11. API Reference

### Workspace API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/workspaces` | - | `WorkspaceDescriptor[]` |
| POST | `/api/workspaces` | `{ path, name? }` | `WorkspaceDescriptor` |
| GET | `/api/workspaces/:id` | - | `WorkspaceDescriptor` |
| DELETE | `/api/workspaces/:id` | - | `{ id, status }` |
| GET | `/api/workspaces/:id/files` | `?path=` | `FileSystemEntry[]` |
| GET | `/api/workspaces/:id/files/search` | `?query=` | `FileSystemEntry[]` |
| GET | `/api/workspaces/:id/files/content` | `?path=` | `{ contents }` |

### Configuration API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/config/app` | - | `AppConfig` |
| PUT | `/api/config/app` | `Partial<AppConfig>` | `AppConfig` |
| GET | `/api/config/binaries` | - | `{ binaries: BinaryRecord[] }` |
| POST | `/api/config/binaries` | `{ path, label?, makeDefault? }` | `{ binary }` |
| PATCH | `/api/config/binaries/:id` | `{ label?, makeDefault? }` | `{ binary }` |
| DELETE | `/api/config/binaries/:id` | - | `204 No Content` |
| POST | `/api/config/binaries/validate` | `{ path }` | `{ valid, version?, error? }` |

### Filesystem API

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/api/filesystem` | `path`, `includeFiles` | `FileSystemListResponse` |

### Events API

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/events` | SSE stream |

### Storage API

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/storage/instances/:id` | - | `InstanceData` |
| PUT | `/api/storage/instances/:id` | `InstanceData` | `204 No Content` |
| DELETE | `/api/storage/instances/:id` | - | `204 No Content` |

### Meta API

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/meta` | `ServerMeta` |

### Instance Proxy

| Method | Path | Description |
|--------|------|-------------|
| ALL | `/workspaces/:id/instance/*` | Proxied to OpenCode |

### Plugin API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspaces/:id/plugin/events` | Plugin SSE stream |
| POST | `/workspaces/:id/plugin/event` | Receive plugin events |

### Background Processes API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspaces/:id/plugin/background-processes` | List processes |
| POST | `/workspaces/:id/plugin/background-processes` | Start process |
| POST | `/workspaces/:id/plugin/background-processes/:pid/stop` | SIGTERM |
| POST | `/workspaces/:id/plugin/background-processes/:pid/terminate` | SIGKILL |
| GET | `/workspaces/:id/plugin/background-processes/:pid/output` | Read output |
| GET | `/workspaces/:id/plugin/background-processes/:pid/stream` | Stream output |

---

## 12. Architecture Diagrams

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Genesis Console                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Desktop Wrapper                                 │  │
│  │               (Electron or Tauri - Optional)                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                     Process Manager                              │  │  │
│  │  │  - Spawns server process                                         │  │  │
│  │  │  - Detects ready state                                           │  │  │
│  │  │  - Navigates webview to server URL                               │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Genesis Console Server                              │  │
│  │                      (Fastify on Port 8888)                           │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │                                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │ Static UI    │  │ REST API     │  │ SSE Events   │                │  │
│  │  │ Serving      │  │ Endpoints    │  │ /api/events  │                │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │  │
│  │         │                 │                 │                         │  │
│  │         └─────────────────┼─────────────────┘                         │  │
│  │                           │                                            │  │
│  │  ┌────────────────────────┴────────────────────────┐                  │  │
│  │  │              Workspace Manager                   │                  │  │
│  │  │  - Spawns OpenCode instances                     │                  │  │
│  │  │  - Proxies requests to instances                 │                  │  │
│  │  │  - Bridges SSE events                            │                  │  │
│  │  └─────────────────────────────────────────────────┘                  │  │
│  │                           │                                            │  │
│  └───────────────────────────┼────────────────────────────────────────────┘  │
│                              │                                               │
│              ┌───────────────┼───────────────┐                              │
│              │               │               │                              │
│              ▼               ▼               ▼                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   OpenCode #1   │ │   OpenCode #2   │ │   OpenCode #N   │               │
│  │  (Workspace A)  │ │  (Workspace B)  │ │  (Workspace N)  │               │
│  │                 │ │                 │ │                 │               │
│  │  Port: 52341    │ │  Port: 52342    │ │  Port: 52XXX    │               │
│  │  PID: 12345     │ │  PID: 12346     │ │  PID: 123XX     │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
┌────────────┐      ┌────────────────────┐      ┌────────────────┐
│  Browser   │      │  Genesis Console   │      │   OpenCode     │
│            │      │      Server        │      │   Instance     │
└─────┬──────┘      └─────────┬──────────┘      └───────┬────────┘
      │                       │                         │
      │  1. Create Workspace  │                         │
      │ ─────────────────────►│                         │
      │  POST /api/workspaces │                         │
      │                       │                         │
      │                       │  2. Spawn Process       │
      │                       │ ───────────────────────►│
      │                       │  opencode serve --port 0│
      │                       │                         │
      │                       │  3. Port Ready          │
      │                       │ ◄───────────────────────│
      │                       │  (stdout parsing)       │
      │                       │                         │
      │  4. Workspace Ready   │                         │
      │ ◄─────────────────────│                         │
      │  SSE: workspace.started                         │
      │                       │                         │
      │  5. Create Session    │                         │
      │ ─────────────────────►│  6. Proxy Request       │
      │  POST /workspaces/:id │ ───────────────────────►│
      │  /instance/session    │  POST /session          │
      │                       │                         │
      │                       │  7. Response            │
      │ ◄─────────────────────│ ◄───────────────────────│
      │                       │                         │
      │  8. Send Message      │                         │
      │ ─────────────────────►│  9. Proxy               │
      │                       │ ───────────────────────►│
      │                       │                         │
      │                       │  10. SSE Stream         │
      │ ◄─────────────────────│ ◄───────────────────────│
      │  instance.event       │  message.part.updated   │
      │  (aggregated)         │                         │
      │                       │                         │
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI State Flow                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Action                                                                 │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────────┐                                                        │
│  │    Component    │ ─── Calls store action ───►  ┌────────────────────┐   │
│  │  (e.g. PromptInput)                            │      Store         │   │
│  └─────────────────┘                              │  (session-actions) │   │
│                                                    └─────────┬──────────┘   │
│                                                              │              │
│                                                              ▼              │
│                                                    ┌────────────────────┐   │
│                                                    │    API Client      │   │
│                                                    │  (sdk-manager)     │   │
│                                                    └─────────┬──────────┘   │
│                                                              │              │
│                                                              ▼              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           Server                                     │   │
│  │  ───────────────────────────────────────────────────────────────►   │   │
│  │                         HTTP Request                                 │   │
│  │  ◄───────────────────────────────────────────────────────────────   │   │
│  │                         SSE Events                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                              │              │
│                                                              ▼              │
│                                                    ┌────────────────────┐   │
│                                                    │   SSE Manager      │   │
│                                                    │ (server-events)    │   │
│                                                    └─────────┬──────────┘   │
│                                                              │              │
│                                                              ▼              │
│                                                    ┌────────────────────┐   │
│                                                    │  Event Bridge      │   │
│                                                    │ (message-v2/bridge)│   │
│                                                    └─────────┬──────────┘   │
│                                                              │              │
│                                                              ▼              │
│                                                    ┌────────────────────┐   │
│  ┌─────────────────┐                              │  Instance Store    │   │
│  │    Component    │ ◄── Reactive update ────────│ (message-v2/store) │   │
│  │  (MessageBlock) │     (SolidJS signals)        └────────────────────┘   │
│  └─────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: File Index

### Key Files by Function

#### Entry Points
- `packages/server/src/index.ts:1` - Server main entry
- `packages/server/src/bin.ts:1` - Production binary entry
- `packages/ui/src/main.tsx:1` - UI application entry
- `packages/ui/src/renderer/main.tsx:1` - Renderer entry
- `packages/electron-app/electron/main/main.ts:1` - Electron main
- `packages/tauri-app/src-tauri/src/main.rs:1` - Tauri main

#### API Routing
- `packages/server/src/server/http-server.ts:1` - Server setup
- `packages/server/src/server/routes/workspaces.ts:1` - Workspace API
- `packages/server/src/server/routes/config.ts:1` - Config API
- `packages/server/src/server/routes/events.ts:1` - SSE endpoint
- `packages/server/src/server/routes/filesystem.ts:1` - Filesystem API

#### State Management
- `packages/ui/src/stores/instances.ts:1` - Instance store
- `packages/ui/src/stores/session-state.ts:1` - Session state
- `packages/ui/src/stores/message-v2/instance-store.ts:1` - Message store
- `packages/ui/src/stores/preferences.tsx:1` - User preferences

#### Core Components
- `packages/ui/src/App.tsx:1` - Root component
- `packages/ui/src/components/folder-selection-view.tsx:1` - Folder picker
- `packages/ui/src/components/instance/instance-shell2.tsx:1` - Main layout
- `packages/ui/src/components/message-section.tsx:1` - Message display
- `packages/ui/src/components/prompt-input.tsx:1` - User input

#### Communication
- `packages/ui/src/lib/api-client.ts:1` - Server API client
- `packages/ui/src/lib/sdk-manager.ts:1` - SDK client management
- `packages/ui/src/lib/sse-manager.ts:1` - SSE handling
- `packages/opencode-config/plugin/lib/client.ts:1` - Plugin client

---

## Appendix B: Configuration Files

### Server Config Location
```
~/.config/codenomad/config.json
```

### OpenCode Instance Config
```
~/.config/opencode/opencode.json
```

### Genesis Console Customizations
- API Port: 8888 (changed from default 9898)
- Branding: "Genesis Console" with gradient logo
- Prompt: Enter to send, Shift+Enter for new line

---

*Document generated through forensic analysis of codebase structure, runtime behavior, and source code examination.*
