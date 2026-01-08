# Genesis Console - Comprehensive Specification

**Version:** 1.0  
**Date:** January 2026  
**Status:** Active Development  
**Document Type:** Technical Specification & Roadmap

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Completed Refactoring Work](#2-completed-refactoring-work)
3. [Next Phase Changes](#3-next-phase-changes)
4. [Feature Prioritization Matrix](#4-feature-prioritization-matrix)
5. [SolidJS Performance Analysis](#5-solidjs-performance-analysis)
6. [Multi-Platform Architecture](#6-multi-platform-architecture)
7. [Network & Security Design](#7-network--security-design)
8. [Publishing Mode Specification](#8-publishing-mode-specification)
9. [Implementation Schedule](#9-implementation-schedule)

---

## 1. Current State Summary

### Project Identity

| Property | Value |
|----------|-------|
| **Name** | Genesis Console |
| **Base** | CodeNomad v0.5.1 (NeuralNomads fork) |
| **Repository** | `fglogan/CodeNomad-1` |
| **Primary UI Framework** | SolidJS 1.8.0 |
| **Server Framework** | Fastify 4.28.1 |
| **Desktop Wrappers** | Electron 39.0, Tauri 2.x |

### Current Deployment

```
Server: http://127.0.0.1:8888
Workspace Root: /Users/tempext/Projects
Config: ~/.config/codenomad/config.json
```

### Git State (as of this specification)

```
Branch: main
Ahead of origin: 6 commits

Commits:
- bbfd8da Extract ShellHeader component and create useDrawerState hook
- f197fd8 Refactor instance-shell2 into modular panel components
- 7147110 Change prompt submit to Enter key and add architecture docs
- 9b4eb52 Fix Genesis logo gradient text rendering
- 7f55264 Update HTML titles to Genesis Console
- 2325407 Rebrand to Genesis Console with styled text logo
```

---

## 2. Completed Refactoring Work

### Phase 1 Progress: Component Extraction

#### 2.1 ShellHeader Component

**File:** `packages/ui/src/components/instance/shell-header.tsx`  
**Lines:** 220  
**Status:** Complete

Extracted the AppBar/Toolbar from instance-shell2.tsx into a standalone component:

```typescript
interface ShellHeaderProps {
  instanceId: string
  onMenuClick: () => void
  onMenuOpenClick: () => void
  isLeftDrawerOpen: boolean
  isRightDrawerOpen: boolean
  toggleRightDrawer: () => void
}

export function ShellHeader(props: ShellHeaderProps): JSX.Element
```

**Features Extracted:**
- Token usage display with visual meter
- Session compacting indicator
- Command palette trigger button
- Connection status indicator
- Drawer toggle buttons
- Keyboard shortcut hints

#### 2.2 useDrawerState Hook

**File:** `packages/ui/src/hooks/use-drawer-state.ts`  
**Lines:** 533  
**Status:** Created (not yet integrated)

Comprehensive drawer state management hook:

```typescript
interface DrawerState {
  isOpen: boolean
  width: number
  minWidth: number
  maxWidth: number
  isResizing: boolean
}

interface UseDrawerStateOptions {
  defaultOpen?: boolean
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  storageKey?: string
  side: 'left' | 'right'
}

function useDrawerState(options: UseDrawerStateOptions): {
  state: DrawerState
  open: () => void
  close: () => void
  toggle: () => void
  setWidth: (width: number) => void
  startResize: () => void
  endResize: () => void
  resizeHandlers: ResizeHandlers
}
```

**Features:**
- Persistent width via localStorage
- Smooth resize with RAF
- Min/max constraints
- Touch gesture support
- Keyboard accessibility

#### 2.3 Panel Component Extraction (Previous Session)

**Files Created:**
```
components/instance/
├── left-panel.tsx      (session list, agent selector)
├── right-panel.tsx     (todos, processes, MCP/LSP status)
├── main-content.tsx    (message section wrapper)
└── index.ts            (barrel exports)
```

#### 2.4 instance-shell2.tsx Reduction

| Stage | Lines | Reduction |
|-------|-------|-----------|
| Original | 1437 | - |
| After panel extraction | 1154 | 20% |
| After ShellHeader extraction | 986 | **31% total** |
| Target (end of Phase 1) | ~600 | 58% |

### Files Modified

```
packages/ui/src/components/instance/instance-shell2.tsx
  - Removed AppBar/Toolbar code (183 lines)
  - Added ShellHeader import
  - Removed unused imports: IconButton, MenuIcon, MenuOpenIcon, Kbd, etc.
  - Current line count: 986

packages/opencode-config/package.json
  - Minor version update
```

---

## 3. Next Phase Changes

### 3.1 Immediate Next Steps (This Week)

| Task | File | Priority | Est. Hours |
|------|------|----------|------------|
| Integrate useDrawerState hook | instance-shell2.tsx | High | 2 |
| Extract SessionListPanel | left-panel.tsx | High | 3 |
| Extract ModelSelectorPanel | left-panel.tsx | Medium | 2 |
| Extract ContextUsageDisplay | assistant-panel.tsx | Medium | 2 |

### 3.2 Phase 1 Completion (Week 1-3)

**Goal:** Complete modular architecture without breaking functionality

```
Target Structure:
packages/ui/src/
├── components/
│   ├── navigator/
│   │   ├── navigator-panel.tsx      (NEW)
│   │   ├── project-tree.tsx         (NEW)
│   │   ├── session-tree.tsx         (refactored from left-panel)
│   │   └── file-explorer.tsx        (NEW)
│   ├── workspace/
│   │   ├── workspace-panel.tsx      (NEW - replaces main-content)
│   │   ├── mode-tabs.tsx            (NEW)
│   │   └── modes/
│   │       ├── chat-mode.tsx        (refactored message-section)
│   │       ├── editor-mode.tsx      (NEW)
│   │       └── preview-mode.tsx     (NEW)
│   ├── assistant/
│   │   ├── assistant-panel.tsx      (refactored right-panel)
│   │   ├── permission-queue.tsx     (NEW - Issue #52)
│   │   ├── agent-context.tsx        (NEW)
│   │   └── service-status.tsx       (extracted)
│   └── instance/
│       ├── shell-layout.tsx         (minimal orchestrator)
│       ├── shell-header.tsx         (DONE)
│       └── index.ts                 (DONE)
├── hooks/
│   ├── use-drawer-state.ts          (DONE)
│   ├── use-layout.ts                (NEW)
│   ├── use-panel-events.ts          (NEW)
│   └── index.ts                     (DONE)
└── lib/
    └── panel-events.ts              (NEW - event bus)
```

### 3.3 Phase 2: Performance (Weeks 4-5)

| Task | Current Impact | Target |
|------|----------------|--------|
| Code splitting for modes | 1.9MB bundle | <600KB initial |
| Lazy load dialogs | Blocks TTI | Load on demand |
| Virtual scrolling | Janky with 100+ messages | 60fps |
| Memo optimization | Cascading re-renders | Surgical updates |

### 3.4 Phase 3: Multi-Surface (Weeks 6-8)

| Surface | Status | Work Required |
|---------|--------|---------------|
| Desktop Wide (1920+) | Working | Minor tweaks |
| Desktop Standard (1280-1920) | Working | Responsive polish |
| Tablet Landscape (1024-1280) | Partial | Panel overlay mode |
| Tablet Portrait (768-1024) | Broken | Single panel + nav |
| Mobile (<768) | Not working | Full redesign |

---

## 4. Feature Prioritization Matrix

### Critical (Must Have)

| Feature | Category | Complexity | Business Value |
|---------|----------|------------|----------------|
| Three-panel modular layout | Architecture | High | Foundation for all features |
| Mobile responsive UI | Platform | High | User accessibility |
| Permission queue sidebar | UX (Issue #52) | Medium | User trust/control |
| Publishing mode MVP | Feature | Very High | Differentiator |
| Enter-to-send (DONE) | UX | Low | User expectation |

### High Priority (Should Have)

| Feature | Category | Complexity | Business Value |
|---------|----------|------------|----------------|
| Virtual scrolling | Performance | Medium | Long session support |
| Code splitting | Performance | Medium | Fast initial load |
| Context-aware agents | Intelligence | High | Productivity boost |
| Tauri desktop enhancements | Platform | Medium | Native experience |
| Session forking UI | UX | Medium | Workflow flexibility |

### Medium Priority (Nice to Have)

| Feature | Category | Complexity | Business Value |
|---------|----------|------------|----------------|
| Offline support | Platform | High | Resilience |
| Voice input | Accessibility | Medium | Hands-free operation |
| Custom themes | Personalization | Low | User satisfaction |
| Plugin marketplace | Ecosystem | Very High | Extensibility |
| Collaborative editing | Feature | Very High | Team use case |

### Low Priority (Future)

| Feature | Category | Complexity | Business Value |
|---------|----------|------------|----------------|
| iOS/Android native apps | Platform | Very High | Mobile-first users |
| Self-hosted cloud | Deployment | High | Enterprise |
| AI model fine-tuning | Intelligence | Very High | Specialization |

---

## 5. SolidJS Performance Analysis

### 5.1 Current Performance Issues

#### Monolithic Component Problem

```typescript
// instance-shell2.tsx (986 lines) causes:
// 1. Large initial parse time
// 2. Difficult to code-split
// 3. Cascading re-renders from any state change
// 4. Poor tree-shaking

// Example: A drawer toggle causes:
createEffect(() => {
  const isOpen = leftDrawerOpen()  // Signal read
  // This effect re-runs, potentially triggering child updates
})
```

#### Memo Chain Inefficiency

```typescript
// Current pattern in session-state.ts:
const activeSessions = createMemo(() => {...})      // Computed
const activeSessionId = createMemo(() => {...})     // Depends on above
const activeSession = createMemo(() => {...})       // Depends on above
const usage = createMemo(() => {...})               // Depends on above

// Problem: 4 memo recalculations for single state change
```

### 5.2 SolidJS Optimization Strategies

#### Fine-Grained Reactivity

```typescript
// AFTER: Single derived context (Phase 2)
const sessionContext = createMemo(() => {
  const instanceId = activeInstanceId()
  if (!instanceId) return null
  
  // All derived values computed once
  const sessionId = sessionStore.getActiveSessionId(instanceId)
  const session = sessionStore.getSession(instanceId, sessionId)
  const usage = usageStore.getSessionUsage(instanceId, sessionId)
  
  return { instanceId, sessionId, session, usage }
})

// Components destructure what they need
function SessionHeader() {
  const ctx = sessionContext()
  return <Show when={ctx}>
    <h2>{ctx.session.title}</h2>
    <UsageMeter usage={ctx.usage} />
  </Show>
}
```

#### Component Boundary Optimization

```typescript
// Use createComponent for dynamic children to preserve reactivity
function PanelContainer(props: { children: JSX.Element }) {
  return (
    <div class="panel">
      {props.children}  // Solid tracks this correctly
    </div>
  )
}

// NOT this (breaks fine-grained updates):
function PanelContainer(props: { render: () => JSX.Element }) {
  return <div class="panel">{props.render()}</div>
}
```

#### Lazy Component Loading

```typescript
// Solid's lazy() for code splitting
const EditorMode = lazy(() => import("./modes/editor-mode"))
const PreviewMode = lazy(() => import("./modes/preview-mode"))
const PublishingMode = lazy(() => import("./modes/publishing-mode"))

function WorkspacePanel() {
  const [mode] = createSignal<Mode>("chat")
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Match when={mode() === "chat"}><ChatMode /></Match>
        <Match when={mode() === "editor"}><EditorMode /></Match>
        <Match when={mode() === "preview"}><PreviewMode /></Match>
        <Match when={mode() === "publishing"}><PublishingMode /></Match>
      </Switch>
    </Suspense>
  )
}
```

### 5.3 Expected Performance Gains

| Metric | Current | After Phase 2 | Improvement |
|--------|---------|---------------|-------------|
| Initial bundle | 1.9MB | ~600KB | 68% smaller |
| Time to interactive | ~4s | <2s | 50% faster |
| Re-render scope | Full tree | Component only | 90% reduction |
| Memory (100 messages) | ~50MB | ~30MB | 40% reduction |
| Scroll frame rate | Variable | 60fps stable | Smooth |

### 5.4 Solid-Specific Best Practices for Genesis

```typescript
// 1. Use createResource for async data
const [sessions] = createResource(instanceId, fetchSessions)

// 2. Use Index for keyed lists (better than For for stable keys)
<Index each={messages()}>
  {(message, i) => <MessageBlock message={message()} index={i} />}
</Index>

// 3. Use on() for explicit dependency tracking
createEffect(on(activeSessionId, (id, prevId) => {
  if (id !== prevId) scrollToBottom()
}))

// 4. Batch updates with batch()
import { batch } from "solid-js"
batch(() => {
  setSession(newSession)
  setMessages(newMessages)
  setStatus("ready")
})
```

---

## 6. Multi-Platform Architecture

### 6.1 Platform Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Genesis Console Platform Matrix                        │
├─────────────────┬─────────────────┬─────────────────┬───────────────────┤
│     Platform    │    Deployment   │    Features     │      Status       │
├─────────────────┼─────────────────┼─────────────────┼───────────────────┤
│ Web Browser     │ HTTP Server     │ Full UI         │ Production        │
│ Electron        │ Desktop App     │ Full + Native   │ Production        │
│ Tauri           │ Desktop App     │ Full + Rust     │ Production        │
│ Mobile Web      │ PWA             │ Touch UI        │ Planned (Phase 3) │
│ Mobile Edge     │ Companion App   │ Remote Control  │ Planned (Phase 6) │
└─────────────────┴─────────────────┴─────────────────┴───────────────────┘
```

### 6.2 WebUI (Current SolidJS App)

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                    Browser Context                        │
├─────────────────────────────────────────────────────────┤
│  SolidJS Application                                     │
│  ├── App.tsx (root)                                      │
│  ├── Stores (reactive state)                             │
│  ├── Components (UI)                                     │
│  └── lib/ (utilities)                                    │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Platform Adapter                     │    │
│  │  ├── storage: localStorage                        │    │
│  │  ├── events: EventSource (SSE)                    │    │
│  │  ├── native: window.open, navigator.clipboard     │    │
│  │  └── display: CSS media queries                   │    │
│  └─────────────────────────────────────────────────┘    │
│           │                                               │
│           ▼ HTTP/SSE                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │            Genesis Console Server                 │    │
│  │                (Port 8888)                        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Responsive Breakpoints:**
```css
/* packages/ui/src/styles/breakpoints.css */
:root {
  --bp-mobile: 768px;
  --bp-tablet: 1024px;
  --bp-desktop: 1280px;
  --bp-wide: 1920px;
}

@media (max-width: 768px) { /* Mobile layout */ }
@media (min-width: 769px) and (max-width: 1024px) { /* Tablet */ }
@media (min-width: 1025px) and (max-width: 1280px) { /* Desktop */ }
@media (min-width: 1281px) { /* Wide desktop */ }
```

### 6.3 Tauri Desktop (Enhanced)

**Current State:**
- Basic window management
- Server process spawning
- Native file dialogs (via plugin)
- Menu bar integration

**Planned Enhancements:**

```rust
// src-tauri/src/main.rs

#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, Error> {
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        memory_total: sys_info::mem_info()?.total,
        memory_free: sys_info::mem_info()?.free,
    })
}

#[tauri::command]
async fn show_notification(title: String, body: String) -> Result<(), Error> {
    Notification::new(&app.config().tauri.bundle.identifier)
        .title(&title)
        .body(&body)
        .show()?;
    Ok(())
}

#[tauri::command]
async fn open_workspace_native(path: String) -> Result<WorkspaceDescriptor, Error> {
    // Direct server communication without HTTP overhead
    workspace_manager.create(path).await
}
```

**Native Features to Add:**
| Feature | Tauri API | Priority |
|---------|-----------|----------|
| System tray icon | `tauri-plugin-tray` | Medium |
| Global hotkeys | `tauri-plugin-global-shortcut` | Medium |
| Auto-updater | `tauri-plugin-updater` | High |
| Deep linking | `tauri-plugin-deep-link` | Low |
| File drag-drop | Built-in | High |

### 6.4 Mobile Edge Control App

**Concept:** Companion mobile app for controlling Genesis Console running on a desktop/server.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Mobile Edge Control Architecture                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────┐         ┌───────────────────────────────┐   │
│  │   Mobile Device        │         │   Desktop/Server               │   │
│  │   (Edge Controller)    │  ◄────► │   (Genesis Console)            │   │
│  ├───────────────────────┤  LAN/   ├───────────────────────────────┤   │
│  │                        │  WAN    │                                │   │
│  │  ┌─────────────────┐  │         │  ┌─────────────────────────┐  │   │
│  │  │ Quick Actions   │  │         │  │ Full Genesis Console    │  │   │
│  │  │ - Send prompt   │  │         │  │ - All workspaces        │  │   │
│  │  │ - Approve perms │  │         │  │ - All sessions          │  │   │
│  │  │ - View status   │  │         │  │ - Full editing          │  │   │
│  │  └─────────────────┘  │         │  └─────────────────────────┘  │   │
│  │                        │         │                                │   │
│  │  ┌─────────────────┐  │         │  ┌─────────────────────────┐  │   │
│  │  │ Notifications   │  │  ◄───── │  │ Push Service            │  │   │
│  │  │ - Permission    │  │         │  │ - Permission requests   │  │   │
│  │  │   requests      │  │         │  │ - Task completions      │  │   │
│  │  │ - Completions   │  │         │  │ - Errors                │  │   │
│  │  └─────────────────┘  │         │  └─────────────────────────┘  │   │
│  │                        │         │                                │   │
│  └───────────────────────┘         └───────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Mobile Edge Features:**

| Feature | Description | Protocol |
|---------|-------------|----------|
| Remote Prompting | Send prompts from phone | WebSocket |
| Permission Approval | Approve/deny tool calls | WebSocket + Push |
| Session Monitoring | View active sessions | SSE |
| Quick Commands | Predefined action buttons | REST |
| Voice Input | Speech-to-text prompts | Client-side |
| QR Pairing | Connect to desktop | QR code scan |

**Technology Options:**
- React Native (cross-platform)
- Flutter (cross-platform, better performance)
- Capacitor (web-based, code sharing)
- Native Swift/Kotlin (best UX, double work)

**Recommendation:** Capacitor with shared SolidJS components for maximum code reuse.

---

## 7. Network & Security Design

### 7.1 Network Modes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Genesis Console Network Modes                       │
├───────────────────────────┬─────────────────────────────────────────────┤
│         Mode              │              Description                     │
├───────────────────────────┼─────────────────────────────────────────────┤
│ Local Only (Default)      │ 127.0.0.1:8888 - localhost only             │
│ LAN Accessible            │ 0.0.0.0:8888 - all interfaces, LAN only     │
│ WAN Accessible            │ Reverse proxy with auth (Cloudflare, nginx) │
│ Tunnel Mode               │ Secure tunnel (ngrok, Cloudflare Tunnel)    │
└───────────────────────────┴─────────────────────────────────────────────┘
```

### 7.2 LAN Operation Mode

**Configuration:**
```json
// ~/.config/codenomad/config.json
{
  "preferences": {
    "listeningMode": "all",  // "local" | "all"
    "allowedOrigins": ["http://192.168.*.*:*"],
    "requireAuthentication": true
  }
}
```

**Server Binding:**
```typescript
// packages/server/src/index.ts
const host = config.preferences.listeningMode === 'all' 
  ? '0.0.0.0' 
  : '127.0.0.1'

await server.listen({ host, port: 8888 })
```

**LAN Discovery (mDNS):**
```typescript
// Future: Auto-discovery for mobile app
import { Bonjour } from 'bonjour-service'

const bonjour = new Bonjour()
bonjour.publish({
  name: 'Genesis Console',
  type: 'http',
  port: 8888,
  txt: {
    version: '1.0',
    hostname: os.hostname()
  }
})
```

### 7.3 WAN/Broadband Operation

**Secure Exposure Options:**

| Method | Complexity | Security | Use Case |
|--------|------------|----------|----------|
| Cloudflare Tunnel | Low | High | Personal remote access |
| Tailscale/ZeroTier | Low | High | Team VPN mesh |
| nginx reverse proxy | Medium | High | Self-hosted with domain |
| Direct port forward | Low | DANGEROUS | Never recommended |

**Cloudflare Tunnel Example:**
```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Create tunnel
cloudflared tunnel create genesis

# Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: genesis
credentials-file: ~/.cloudflared/genesis.json

ingress:
  - hostname: genesis.yourdomain.com
    service: http://localhost:8888
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run genesis
```

### 7.4 Authentication & Authorization

**Token-Based Authentication:**

```typescript
// packages/server/src/auth/token-auth.ts
interface AuthToken {
  id: string
  name: string
  permissions: Permission[]
  createdAt: Date
  expiresAt?: Date
  lastUsedAt?: Date
}

type Permission = 
  | 'workspaces:read'
  | 'workspaces:write'
  | 'sessions:read'
  | 'sessions:write'
  | 'config:read'
  | 'config:write'
  | 'filesystem:read'
  | 'filesystem:write'

// Middleware
async function authenticateRequest(request: FastifyRequest): Promise<AuthToken> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing authorization header')
  }
  
  const token = authHeader.slice(7)
  const authToken = await tokenStore.validate(token)
  
  if (!authToken) {
    throw new UnauthorizedError('Invalid token')
  }
  
  return authToken
}
```

**API Key Management UI:**

```typescript
// packages/ui/src/components/settings/api-keys.tsx
function ApiKeyManagement() {
  const [keys, { refetch }] = createResource(fetchApiKeys)
  
  return (
    <div class="api-keys">
      <h3>API Keys</h3>
      <For each={keys()}>
        {(key) => (
          <div class="key-row">
            <span>{key.name}</span>
            <span>{key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never used'}</span>
            <button onClick={() => revokeKey(key.id)}>Revoke</button>
          </div>
        )}
      </For>
      <button onClick={createNewKey}>Create New Key</button>
    </div>
  )
}
```

### 7.5 Secure API Communication

**Request Signing (for WAN):**

```typescript
// Client-side request signing
import { createHmac } from 'crypto'

function signRequest(method: string, path: string, body: string, secret: string): string {
  const timestamp = Date.now().toString()
  const payload = `${method}:${path}:${timestamp}:${body}`
  const signature = createHmac('sha256', secret).update(payload).digest('hex')
  
  return `t=${timestamp},s=${signature}`
}

// Server-side validation
function validateSignature(request: FastifyRequest, secret: string): boolean {
  const sig = request.headers['x-genesis-signature']
  const [tPart, sPart] = sig.split(',')
  const timestamp = parseInt(tPart.split('=')[1])
  const signature = sPart.split('=')[1]
  
  // Check timestamp freshness (5 minute window)
  if (Date.now() - timestamp > 5 * 60 * 1000) {
    return false
  }
  
  const expectedSig = computeSignature(request, timestamp, secret)
  return timingSafeEqual(signature, expectedSig)
}
```

**CORS Configuration:**

```typescript
// packages/server/src/server/http-server.ts
server.register(cors, {
  origin: (origin, cb) => {
    const allowed = config.preferences.allowedOrigins
    if (!origin || allowed.some(pattern => matchOrigin(origin, pattern))) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'), false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
})
```

### 7.6 Security Checklist

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| HTTPS for WAN | Required | Via reverse proxy/tunnel |
| Token authentication | Planned | Bearer token auth |
| CORS restrictions | Partial | Origin whitelist |
| Request signing | Planned | HMAC-SHA256 |
| Rate limiting | Not implemented | fastify-rate-limit |
| Audit logging | Not implemented | Action log store |
| Secrets isolation | Partial | Env vars, not committed |

---

## 8. Publishing Mode Specification

### 8.1 Overview

Publishing Mode transforms Genesis Console into a comprehensive authoring environment for long-form content creation.

**Target Users:**
- Technical writers
- Book authors
- Documentation teams
- Content creators

**Key Differentiators:**
- AI-assisted writing with narrative continuity
- Chapter-based project organization
- Multi-format export (MD, PDF, EPUB, HTML)
- Knowledge graph visualization
- Integrated research and citation

### 8.2 MarkdownPlus Editor

**MarkdownPlus** extends standard Markdown with authoring-specific features:

```markdown
# Chapter Title {#chapter-1}

:::: note
This is a callout note with special styling.
::::

:::: warning
Important warning block.
::::

[^footnote]: This is a footnote definition.

Reference a footnote[^footnote] in text.

<!-- @character: John -->
"Dialogue attributed to a character," John said.
<!-- @end-character -->

<!-- @timeline: 2025-01-01 -->
Events with timeline markers.
<!-- @end-timeline -->

:::: spoiler title="Hidden content"
Content that can be collapsed.
::::

[[Internal Link|Display Text]]  <!-- Wiki-style links -->

@import "shared/definitions.md"  <!-- Include other files -->

<!-- @metric: words -->  <!-- Word count placeholder -->
<!-- @metric: reading-time -->  <!-- Reading time placeholder -->
```

**Editor Features:**

| Feature | Description | Implementation |
|---------|-------------|----------------|
| Syntax highlighting | Markdown + extensions | Shiki with custom grammar |
| Live preview | Side-by-side rendering | Split pane component |
| Auto-completion | Character/location names | LSP-like provider |
| Outline view | Heading navigation | Parser-based TOC |
| Find/Replace | Regex support | CodeMirror integration |
| Focus mode | Distraction-free writing | Dimmed non-active paragraphs |
| Typewriter mode | Centered current line | Scroll lock option |

### 8.3 WYSIWYG Viewer

**Rendering Pipeline:**

```typescript
// packages/ui/src/components/publishing/preview/render-pipeline.ts
interface RenderPipeline {
  parse: (markdown: string) => AST
  transform: (ast: AST, plugins: TransformPlugin[]) => AST
  render: (ast: AST, theme: RenderTheme) => HTML
  hydrate: (html: HTML, interactivePlugins: HydratePlugin[]) => void
}

const pipeline: RenderPipeline = {
  parse: (md) => {
    const parser = new MarkdownPlusParser()
    return parser.parse(md)
  },
  
  transform: (ast, plugins) => {
    return plugins.reduce((a, plugin) => plugin.transform(a), ast)
  },
  
  render: (ast, theme) => {
    const renderer = new HtmlRenderer(theme)
    return renderer.render(ast)
  },
  
  hydrate: (html, plugins) => {
    plugins.forEach(plugin => plugin.hydrate(html))
  }
}
```

**Theme System:**

```typescript
interface RenderTheme {
  name: string
  fonts: {
    heading: string
    body: string
    code: string
  }
  colors: {
    text: string
    background: string
    accent: string
    link: string
  }
  spacing: {
    paragraph: string
    heading: string
    list: string
  }
  pageLayout: {
    maxWidth: string
    margin: string
    lineHeight: number
  }
}

// Pre-built themes
const themes = {
  manuscript: { /* Traditional book layout */ },
  technical: { /* Technical documentation */ },
  blog: { /* Web-friendly blog post */ },
  ebook: { /* E-reader optimized */ },
}
```

### 8.4 Genesis Memory Fabric

**Concept:** A knowledge graph that tracks entities, relationships, and narrative elements across the manuscript.

```typescript
interface MemoryFabric {
  entities: {
    characters: Character[]
    locations: Location[]
    concepts: Concept[]
    events: Event[]
    sources: Source[]
  }
  
  relationships: Relationship[]
  
  timeline: TimelineEvent[]
  
  consistency: {
    check: (change: ContentChange) => ConsistencyReport
    violations: Violation[]
  }
}

interface Character {
  id: string
  name: string
  aliases: string[]
  description: string
  firstAppearance: ChapterRef
  appearances: ChapterRef[]
  relationships: CharacterRelationship[]
  attributes: Record<string, string>  // hair color, age, etc.
  arc: string[]  // Character development notes
}

interface Relationship {
  from: EntityRef
  to: EntityRef
  type: RelationshipType
  description: string
  establishedAt: ChapterRef
  context: string[]
}
```

**Memory Fabric Navigator UI:**

```typescript
function MemoryFabricNavigator() {
  const [fabric] = createResource(manuscriptId, loadMemoryFabric)
  const [view, setView] = createSignal<'list' | 'graph'>('list')
  const [filter, setFilter] = createSignal<EntityType | 'all'>('all')
  
  return (
    <div class="memory-fabric">
      <div class="toolbar">
        <ViewToggle value={view()} onChange={setView} />
        <EntityFilter value={filter()} onChange={setFilter} />
        <SearchInput onSearch={searchFabric} />
      </div>
      
      <Switch>
        <Match when={view() === 'list'}>
          <EntityList 
            entities={filteredEntities()} 
            onSelect={showEntityDetail} 
          />
        </Match>
        <Match when={view() === 'graph'}>
          <GraphVisualizer 
            nodes={fabric().entities}
            edges={fabric().relationships}
            onNodeClick={showEntityDetail}
          />
        </Match>
      </Switch>
      
      <EntityDetailPanel entity={selectedEntity()} />
    </div>
  )
}
```

### 8.5 Graph Visualizer

**Technology:** D3.js or Cytoscape.js for force-directed graph layout

```typescript
interface GraphVisualizerProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  layout: 'force' | 'hierarchical' | 'radial'
  onNodeClick: (node: GraphNode) => void
  onEdgeClick: (edge: GraphEdge) => void
  selectedNodes: string[]
  highlightPath: string[]
}

interface GraphNode {
  id: string
  label: string
  type: EntityType
  size: number  // Based on mention count
  metadata: Record<string, unknown>
}

interface GraphEdge {
  source: string
  target: string
  type: RelationshipType
  weight: number  // Relationship strength
  label?: string
}
```

**Graph Features:**

| Feature | Description |
|---------|-------------|
| Force-directed layout | Automatic node positioning |
| Node clustering | Group by entity type |
| Path highlighting | Show connection paths |
| Timeline filter | Show state at point in story |
| Search focus | Zoom to searched entity |
| Export | PNG, SVG, or JSON |

### 8.6 Integrated AI Intelligence

**Writing Assistant Prompts:**

```typescript
const writingPrompts = {
  // Content generation
  expand: (section: string) => 
    `Expand this section with more vivid detail and sensory description:\n\n${section}`,
  
  summarize: (chapter: string) =>
    `Provide a concise summary of this chapter suitable for a table of contents:\n\n${chapter}`,
  
  dialogue: (context: string, characters: Character[]) =>
    `Write natural dialogue for this scene between ${characters.map(c => c.name).join(' and ')}:\n\nContext: ${context}`,
  
  // Editing assistance
  clarity: (text: string) =>
    `Improve the clarity and readability of this passage without changing its meaning:\n\n${text}`,
  
  consistency: (text: string, fabric: MemoryFabric) =>
    `Check this passage for consistency with the established story elements:\n\n${text}\n\nKnown elements: ${JSON.stringify(fabric.entities)}`,
  
  // Research
  research: (topic: string) =>
    `Provide factual information about "${topic}" that I can use as reference for my writing.`,
  
  citation: (source: string) =>
    `Format this source as a proper citation:\n\n${source}`,
}
```

**Consistency Checking:**

```typescript
async function checkConsistency(
  manuscript: Manuscript,
  chapter: Chapter,
  fabric: MemoryFabric
): Promise<ConsistencyReport> {
  const issues: ConsistencyIssue[] = []
  
  // Character consistency
  for (const mention of extractCharacterMentions(chapter)) {
    const character = fabric.entities.characters.find(c => 
      c.name === mention.name || c.aliases.includes(mention.name)
    )
    
    if (!character) {
      issues.push({
        type: 'unknown_character',
        location: mention.location,
        message: `Unknown character: ${mention.name}`,
        suggestion: 'Add to character list or check spelling',
      })
    }
  }
  
  // Timeline consistency
  const chapterEvents = extractTimelineEvents(chapter)
  for (const event of chapterEvents) {
    const conflicts = findTimelineConflicts(event, fabric.timeline)
    issues.push(...conflicts)
  }
  
  // Attribute consistency (e.g., eye color mentioned differently)
  const attributeMentions = extractAttributeMentions(chapter)
  for (const mention of attributeMentions) {
    const established = fabric.entities.characters
      .find(c => c.id === mention.characterId)
      ?.attributes[mention.attribute]
    
    if (established && established !== mention.value) {
      issues.push({
        type: 'attribute_conflict',
        location: mention.location,
        message: `${mention.characterName}'s ${mention.attribute} was established as "${established}" but described as "${mention.value}"`,
        suggestion: `Change to "${established}" or update character profile`,
      })
    }
  }
  
  return { issues, checkedAt: new Date() }
}
```

### 8.7 Export Capabilities

**Supported Formats:**

| Format | Use Case | Library |
|--------|----------|---------|
| Markdown | Source control, Jekyll | Built-in |
| PDF | Print, formal submission | Puppeteer/Prince |
| EPUB | E-readers | epub-gen |
| HTML | Web publishing | marked + custom |
| DOCX | Word editing | docx.js |
| LaTeX | Academic publishing | Custom templates |

**Export Configuration:**

```typescript
interface ExportConfig {
  format: ExportFormat
  template: string
  options: {
    includeMetadata: boolean
    includeToc: boolean
    includeIndex: boolean
    pageSize: 'letter' | 'a4' | 'ebook'
    margins: Margins
    fonts: FontConfig
    coverImage?: string
  }
  filters: {
    chapters: string[] | 'all'
    excludeDrafts: boolean
    stripComments: boolean
  }
}
```

---

## 9. Implementation Schedule

### Phase 1: Foundation (Weeks 1-3) - CURRENT

| Week | Tasks | Deliverable |
|------|-------|-------------|
| 1 | Integrate useDrawerState, extract remaining panels | Clean panel structure |
| 2 | Create NavigatorPanel, WorkspacePanel shells | New component hierarchy |
| 3 | Create AssistantPanel with permission queue | Issue #52 resolved |

**Status:** Week 1 in progress

### Phase 2: Performance (Weeks 4-5)

| Week | Tasks | Deliverable |
|------|-------|-------------|
| 4 | Code splitting, lazy loading | 50% bundle reduction |
| 5 | Virtual scrolling, memo optimization | 60fps scrolling |

### Phase 3: Multi-Surface (Weeks 6-8)

| Week | Tasks | Deliverable |
|------|-------|-------------|
| 6 | Platform adapter, responsive layouts | Tablet support |
| 7 | Mobile components, touch gestures | Mobile layout |
| 8 | Tauri enhancements, native features | Desktop polish |

### Phase 4: Streaming (Weeks 9-10)

| Week | Tasks | Deliverable |
|------|-------|-------------|
| 9 | Streaming text, deferred highlighting | Smooth streaming |
| 10 | Smart scrolling, SSE multiplexing | Network efficiency |

### Phase 5: Agents (Weeks 11-12)

| Week | Tasks | Deliverable |
|------|-------|-------------|
| 11 | Agent framework, code/review agents | Context awareness |
| 12 | Writing agent, suggested actions | Productivity features |

### Phase 6: Publishing (Weeks 13-16)

| Week | Tasks | Deliverable |
|------|-------|-------------|
| 13 | Manuscript model, navigator | Basic structure |
| 14 | MarkdownPlus editor, preview | Writing capability |
| 15 | Memory Fabric, consistency checker | Narrative tools |
| 16 | Export pipeline, polish | Complete publishing mode |

### Milestone Summary

```
Week 3:  ✓ Modular architecture complete
Week 5:  ✓ Performance targets met
Week 8:  ✓ All platforms supported
Week 10: ✓ Streaming experience polished
Week 12: ✓ Intelligent agents active
Week 16: ✓ Publishing mode launched

Total Duration: 16 weeks (4 months)
```

---

## Appendix A: Technical Debt

| Item | Location | Priority | Est. Effort |
|------|----------|----------|-------------|
| instance-shell2.tsx size | components/instance | High | 2 weeks |
| prompt-input.tsx size (1209 lines) | components | High | 1 week |
| Duplicate memo calculations | stores/session-state | Medium | 3 days |
| Inconsistent error handling | lib/api-client | Medium | 2 days |
| Missing TypeScript strict checks | tsconfig.json | Low | 1 week |
| Test coverage (currently ~0%) | All packages | High | Ongoing |

## Appendix B: Dependencies to Evaluate

| Dependency | Current | Concern | Alternative |
|------------|---------|---------|-------------|
| @suid/material | 0.18.0 | Bundle size | Custom components |
| shiki | 3.13.0 | Initial load | Lazy load |
| marked | 12.0.0 | Limited extension | remark/unified |
| lucide-solid | 0.300.0 | Unused icons | Tree shake audit |

## Appendix C: Metrics Tracking

| Metric | Current | Phase 2 Target | Phase 6 Target |
|--------|---------|----------------|----------------|
| Bundle size (gzip) | ~600KB | <200KB | <250KB |
| Time to interactive | ~4s | <2s | <2s |
| Lighthouse (mobile) | N/A | >80 | >90 |
| Largest component | 1437 lines | <400 lines | <400 lines |
| Test coverage | 0% | 40% | 70% |

---

*This specification is a living document. Update version and date when making significant changes.*

**Version History:**
- 1.0 (2026-01-08): Initial comprehensive specification
