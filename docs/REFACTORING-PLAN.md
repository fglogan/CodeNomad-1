# Genesis Console - Refactoring & Feature Plan

**Version:** 1.0  
**Date:** January 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Upstream Sync Status](#1-upstream-sync-status)
2. [Open Issues & Feature Requests](#2-open-issues--feature-requests)
3. [Three-Panel Modular Architecture](#3-three-panel-modular-architecture)
4. [Multi-Surface Strategy](#4-multi-surface-strategy)
5. [Performance Optimization Plan](#5-performance-optimization-plan)
6. [Streaming Chat Improvements](#6-streaming-chat-improvements)
7. [Context-Aware Agent Integration](#7-context-aware-agent-integration)
8. [Book Writing & Publishing Mode](#8-book-writing--publishing-mode)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Upstream Sync Status

### Current State
- **Fork:** `fglogan/CodeNomad-1`
- **Upstream:** `NeuralNomadsAI/CodeNomad`
- **Base Version:** v0.5.1 (synced as of 2026-01-07)
- **Genesis Commits:** 3 (branding + Enter key fix)

### Recent Upstream Changes (v0.5.0 → v0.5.1)

| Commit | Feature/Fix |
|--------|-------------|
| `eb89dfa` | iOS input auto-zoom fix |
| `25bf313` | Compaction indicator in message stream/timeline |
| `315abf2` | Session status hydration and compaction transitions |
| `f24e360` | Optimize session status updates |
| `e09ce07` | Permission reconciliation after message hydration |
| `06416a9` | Instance tab session status indicator |
| `1377bc6` | Migrate UI to v2 SDK client |
| `c2df32e` | Stream ANSI tool output rendering |

### Recommended Upstream Merges

None needed - we're current. Monitor for:
- Permission queue UI (Issue #52)
- Custom commands fix (Issue #47)
- WSL improvements (Issue #5)

---

## 2. Open Issues & Feature Requests

### From Upstream (Priority)

| # | Issue | Priority | Genesis Plan |
|---|-------|----------|--------------|
| 52 | Pending permissions list in sidebar | High | Include in right panel redesign |
| 47 | Custom commands broken | Medium | Fix after panel refactor |
| 32 | UI/UX tweaks (retroactive edit, markdown in user messages) | Medium | Phase 2 features |
| 18 | Client-side YOLO mode | Low | Evaluate for publishing mode |
| 5 | WSL support | Low | Works via web mode |

### Genesis-Specific Requirements

| Feature | Priority | Description |
|---------|----------|-------------|
| Three-Panel Layout | High | Modular panels: Navigator, Editor, Assistant |
| Mobile Surface | High | Touch-optimized responsive UI |
| Publishing Mode | High | Book writing with chapter management |
| Context Agents | Medium | Specialized agents for different workflows |
| Offline Support | Medium | Local-first architecture |

---

## 3. Three-Panel Modular Architecture

### Current Layout Analysis

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Current Layout                             │
├───────────────┬────────────────────────────────┬────────────────────┤
│ Left Drawer   │         Main Content           │   Right Drawer     │
│ (Sessions)    │    (Message Stream +           │   (Status Panel)   │
│               │     Prompt Input)              │                    │
│ - Session     │                                │ - Plan/Todos       │
│   List        │                                │ - Background       │
│ - Agent       │                                │   Shells           │
│   Selector    │                                │ - MCP Status       │
│ - Model       │                                │ - LSP Status       │
│   Selector    │                                │ - Plugins          │
└───────────────┴────────────────────────────────┴────────────────────┘
```

### Proposed Three-Panel Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Genesis Console 2.0                              │
├───────────────┬────────────────────────────────┬────────────────────┤
│  NAVIGATOR    │         WORKSPACE              │    ASSISTANT       │
│  PANEL        │         PANEL                  │    PANEL           │
├───────────────┼────────────────────────────────┼────────────────────┤
│               │                                │                    │
│ ┌───────────┐ │  ┌──────────────────────────┐ │ ┌────────────────┐ │
│ │ Projects  │ │  │     Mode Tabs            │ │ │ Active Agent   │ │
│ │ - Project1│ │  │ [Chat] [Editor] [Preview]│ │ │ ┌────────────┐ │ │
│ │ - Project2│ │  └──────────────────────────┘ │ │ │ Agent:     │ │ │
│ └───────────┘ │                                │ │ │ build      │ │ │
│               │  ┌──────────────────────────┐ │ │ │ Model:     │ │ │
│ ┌───────────┐ │  │                          │ │ │ │ claude-4   │ │ │
│ │ Sessions  │ │  │     Mode Content         │ │ │ └────────────┘ │ │
│ │ - Current │ │  │                          │ │ │                │ │
│ │ - History │ │  │  (Varies by mode:        │ │ │ ┌────────────┐ │ │
│ └───────────┘ │  │   - Chat stream          │ │ │ │ Context    │ │ │
│               │  │   - Code editor          │ │ │ │ Usage      │ │ │
│ ┌───────────┐ │  │   - Document preview)    │ │ │ │ 45K/128K   │ │ │
│ │ Chapters  │ │  │                          │ │ │ └────────────┘ │ │
│ │ (Publish) │ │  │                          │ │ │                │ │
│ │ - Ch 1    │ │  │                          │ │ │ ┌────────────┐ │ │
│ │ - Ch 2    │ │  └──────────────────────────┘ │ │ │ Pending    │ │ │
│ └───────────┘ │                                │ │ │ Permissions│ │ │
│               │  ┌──────────────────────────┐ │ │ │ [3 items]  │ │ │
│ ┌───────────┐ │  │     Input Area           │ │ │ └────────────┘ │ │
│ │ Files     │ │  │                          │ │ │                │ │
│ │ - src/    │ │  │  [Prompt Input + Tools]  │ │ │ ┌────────────┐ │ │
│ │ - docs/   │ │  │                          │ │ │ │ Processes  │ │ │
│ └───────────┘ │  └──────────────────────────┘ │ │ │ [2 running]│ │ │
│               │                                │ │ └────────────┘ │ │
└───────────────┴────────────────────────────────┴────────────────────┘
```

### Panel Specifications

#### Navigator Panel (Left)

**Purpose:** Project and content navigation

```typescript
interface NavigatorPanel {
  sections: {
    projects: ProjectTree        // Multi-workspace navigation
    sessions: SessionList        // Chat session history
    chapters: ChapterTree        // Publishing mode only
    files: FileExplorer          // Quick file access
  }
  
  state: {
    activeSection: 'projects' | 'sessions' | 'chapters' | 'files'
    collapsed: boolean
    width: number               // Resizable
  }
}
```

**Components:**
```
components/navigator/
├── navigator-panel.tsx          (orchestrator)
├── project-tree.tsx             (workspace list)
├── session-tree.tsx             (session history with hierarchy)
├── chapter-tree.tsx             (publishing outline)
├── file-explorer.tsx            (quick file access)
└── navigator-search.tsx         (universal search)
```

#### Workspace Panel (Center)

**Purpose:** Primary content area with mode switching

```typescript
interface WorkspacePanel {
  modes: {
    chat: ChatMode              // Current message stream
    editor: EditorMode          // Code/document editing
    preview: PreviewMode        // Rendered output view
    diff: DiffMode              // Change comparison
  }
  
  state: {
    activeMode: 'chat' | 'editor' | 'preview' | 'diff'
    splitView: boolean          // Side-by-side modes
    secondaryMode?: string      // For split view
  }
}
```

**Components:**
```
components/workspace/
├── workspace-panel.tsx          (mode orchestrator)
├── mode-tabs.tsx                (mode switcher)
├── modes/
│   ├── chat-mode.tsx            (refactored message-section)
│   ├── editor-mode.tsx          (code editing)
│   ├── preview-mode.tsx         (markdown/HTML preview)
│   └── diff-mode.tsx            (change visualization)
├── input/
│   ├── unified-input.tsx        (refactored prompt-input)
│   ├── command-bar.tsx          (slash commands)
│   └── attachment-dock.tsx      (file attachments)
└── toolbar/
    └── workspace-toolbar.tsx    (mode-specific tools)
```

#### Assistant Panel (Right)

**Purpose:** Agent status and context management

```typescript
interface AssistantPanel {
  sections: {
    agent: AgentStatus          // Current agent + model
    context: ContextUsage       // Token usage visualization
    permissions: PermissionQueue // Pending approvals (Issue #52)
    processes: BackgroundShells // Running processes
    services: ServiceStatus     // MCP, LSP, Plugins
    plan: TodoList              // AI-generated plan
  }
  
  state: {
    expandedSections: string[]
    collapsed: boolean
    width: number
  }
}
```

**Components:**
```
components/assistant/
├── assistant-panel.tsx          (orchestrator)
├── agent-status.tsx             (agent + model selector)
├── context-usage.tsx            (visual token meter)
├── permission-queue.tsx         (NEW: pending approvals list)
├── background-shells.tsx        (process management)
├── service-status.tsx           (MCP/LSP/plugins)
└── plan-view.tsx                (todo list)
```

### Panel Communication

```typescript
// Shared event bus for panel coordination
interface PanelEvents {
  'navigator:project-selected': { projectId: string }
  'navigator:session-selected': { sessionId: string }
  'navigator:chapter-selected': { chapterId: string }
  'navigator:file-selected': { filePath: string }
  
  'workspace:mode-changed': { mode: WorkspaceMode }
  'workspace:content-updated': { contentId: string }
  'workspace:input-submitted': { content: string, attachments: Attachment[] }
  
  'assistant:permission-approved': { permissionId: string }
  'assistant:permission-denied': { permissionId: string }
  'assistant:agent-changed': { agent: string, model: ModelPreference }
  'assistant:process-action': { processId: string, action: 'stop' | 'terminate' }
}
```

---

## 4. Multi-Surface Strategy

### Surface Definitions

| Surface | Description | Panel Layout | Priority |
|---------|-------------|--------------|----------|
| **Desktop Wide** | 1920px+ | 3 panels visible | High |
| **Desktop Standard** | 1280-1920px | 3 panels, collapsible | High |
| **Tablet Landscape** | 1024-1280px | 2 panels + overlay | Medium |
| **Tablet Portrait** | 768-1024px | 1 panel + navigation | Medium |
| **Mobile** | <768px | 1 panel + bottom nav | High |

### Layout Configurations

```typescript
interface LayoutConfig {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
    wide: 1920
  }
  
  layouts: {
    wide: {
      navigator: { visible: true, width: 280, collapsible: true }
      workspace: { visible: true, flex: 1 }
      assistant: { visible: true, width: 320, collapsible: true }
    }
    desktop: {
      navigator: { visible: true, width: 240, collapsible: true }
      workspace: { visible: true, flex: 1 }
      assistant: { visible: true, width: 280, collapsible: true }
    }
    tablet: {
      navigator: { visible: 'overlay', width: 280 }
      workspace: { visible: true, flex: 1 }
      assistant: { visible: 'overlay', width: 320 }
    }
    mobile: {
      navigator: { visible: 'sheet', height: '80vh' }
      workspace: { visible: true, flex: 1 }
      assistant: { visible: 'sheet', height: '60vh' }
      bottomNav: true
    }
  }
}
```

### Mobile-Specific Components

```
components/mobile/
├── bottom-navigation.tsx        (panel switcher)
├── mobile-header.tsx            (condensed toolbar)
├── swipe-panel.tsx              (gesture-based navigation)
├── quick-actions-fab.tsx        (floating action button)
└── mobile-input/
    ├── mobile-prompt.tsx        (touch-optimized input)
    ├── voice-input.tsx          (speech-to-text)
    └── attachment-picker.tsx    (mobile file picker)
```

### Tauri Desktop Enhancements

```
components/desktop/
├── native-menu-integration.tsx  (OS menu bar)
├── window-controls.tsx          (traffic lights/title bar)
├── file-drop-zone.tsx           (drag-and-drop files)
├── system-tray.tsx              (background status)
└── notifications/
    ├── native-notification.tsx  (OS notifications)
    └── permission-alert.tsx     (urgent permission requests)
```

### Platform Adapter Interface

```typescript
// packages/ui-core/platform/adapter.ts
export interface PlatformAdapter {
  // Display
  display: {
    getBreakpoint(): Breakpoint
    onBreakpointChange(handler: (bp: Breakpoint) => void): () => void
    supportsHover(): boolean
    supportsTouchscreen(): boolean
    getColorScheme(): 'light' | 'dark' | 'system'
  }
  
  // Storage
  storage: {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T): Promise<void>
    remove(key: string): Promise<void>
    keys(): Promise<string[]>
  }
  
  // Events
  events: {
    connectSSE(url: string): SSEConnection
    registerPushHandler?(handler: PushHandler): void
  }
  
  // Native
  native: {
    openExternal(url: string): Promise<void>
    copyToClipboard(text: string): Promise<void>
    showNotification?(title: string, body: string): Promise<void>
    openFileDialog?(options: FileDialogOptions): Promise<string[]>
    openFolderDialog?(options: FolderDialogOptions): Promise<string | null>
  }
  
  // Offline
  offline?: {
    isOnline(): boolean
    onOnlineChange(handler: (online: boolean) => void): () => void
    queueAction(action: OfflineAction): Promise<void>
    syncPendingActions(): Promise<void>
  }
}
```

---

## 5. Performance Optimization Plan

### Phase 1: Bundle Optimization

#### Code Splitting Strategy

```typescript
// Current: Monolithic bundle
import InstanceShell2 from "./instance/instance-shell2"

// Target: Lazy loading by feature
const NavigatorPanel = lazy(() => import("./navigator/navigator-panel"))
const AssistantPanel = lazy(() => import("./assistant/assistant-panel"))
const ChatMode = lazy(() => import("./workspace/modes/chat-mode"))
const EditorMode = lazy(() => import("./workspace/modes/editor-mode"))
const PublishingMode = lazy(() => import("./workspace/modes/publishing-mode"))

// Dialog splitting
const dialogs = {
  FileBrowser: lazy(() => import("./dialogs/file-browser")),
  DirectoryBrowser: lazy(() => import("./dialogs/directory-browser")),
  Settings: lazy(() => import("./dialogs/settings")),
  ProcessOutput: lazy(() => import("./dialogs/process-output")),
}
```

#### Bundle Size Targets

| Chunk | Current | Target | Strategy |
|-------|---------|--------|----------|
| Main | ~1.9MB | <500KB | Code splitting |
| Shiki (syntax) | ~600KB | Lazy | Load on first code block |
| Icons | ~50KB | <20KB | Tree shaking audit |
| SUID/Material | ~150KB | 0 | Replace with custom |

### Phase 2: Render Optimization

#### Component Decomposition

```
Before: instance-shell2.tsx (1437 lines)
After:
├── shell-layout.tsx         (200 lines)
├── shell-header.tsx         (150 lines)  
├── navigator-panel.tsx      (250 lines)
├── workspace-panel.tsx      (300 lines)
├── assistant-panel.tsx      (200 lines)
└── hooks/
    ├── use-layout.ts        (80 lines)
    ├── use-drawer-state.ts  (60 lines)
    └── use-resize.ts        (80 lines)
```

#### Memoization Strategy

```typescript
// Current: Multiple redundant memos
const activeSessions = createMemo(() => {...})
const activeSessionId = createMemo(() => {...})
const activeSession = createMemo(() => {...})  // Depends on above
const usage = createMemo(() => {...})          // Depends on above

// Optimized: Single derived context
const sessionContext = createMemo(() => {
  const instanceId = activeInstanceId()
  if (!instanceId) return null
  
  const sessionId = sessionStore.getActiveSessionId(instanceId)
  const session = sessionStore.getSession(instanceId, sessionId)
  const usage = usageStore.getSessionUsage(instanceId, sessionId)
  
  return { instanceId, sessionId, session, usage }
})

// Components use single context
const { session, usage } = sessionContext() ?? {}
```

#### Virtual Scrolling

```typescript
// For long message lists
import { VirtualList } from './virtual-list'

function MessageList(props: { messages: MessageRecord[] }) {
  return (
    <VirtualList
      items={props.messages}
      itemHeight={estimateMessageHeight}
      overscan={3}
      renderItem={(message) => <MessageBlock message={message} />}
    />
  )
}
```

### Phase 3: Network Optimization

#### SSE Connection Pooling

```typescript
// Current: One SSE per feature
const serverEvents = connectSSE('/api/events')
const instanceEvents = connectSSE(`/workspaces/${id}/instance/events`)

// Optimized: Multiplexed connection
const eventMultiplexer = createEventMultiplexer({
  serverUrl: '/api/events',
  instanceUrl: (id) => `/workspaces/${id}/instance/events`,
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
})

eventMultiplexer.subscribe('workspace.*', handleWorkspaceEvent)
eventMultiplexer.subscribe('instance.*', handleInstanceEvent)
eventMultiplexer.subscribeInstance(instanceId, handleMessages)
```

#### Request Batching

```typescript
// Batch multiple API calls
const batcher = createRequestBatcher({
  maxBatchSize: 10,
  maxWaitMs: 50,
})

// Instead of individual calls
await Promise.all([
  api.getSession(id1),
  api.getSession(id2),
  api.getSession(id3),
])

// Batched call
const sessions = await batcher.batch([
  { method: 'getSession', args: [id1] },
  { method: 'getSession', args: [id2] },
  { method: 'getSession', args: [id3] },
])
```

---

## 6. Streaming Chat Improvements

### Current Limitations

1. Message parts rendered as they arrive but cause full re-renders
2. Syntax highlighting blocks during streaming
3. Scroll anchoring can be janky with large updates
4. No typing indicators for multi-turn context

### Proposed Improvements

#### Incremental Part Rendering

```typescript
interface StreamingPart {
  id: string
  type: 'text' | 'code' | 'tool'
  content: string
  isStreaming: boolean
  cursorPosition?: number
}

function StreamingText(props: { part: StreamingPart }) {
  const [displayedContent, setDisplayedContent] = createSignal('')
  
  createEffect(() => {
    if (props.part.isStreaming) {
      // Animate text appearance
      animateTextStream(props.part.content, setDisplayedContent)
    } else {
      setDisplayedContent(props.part.content)
    }
  })
  
  return (
    <div class="streaming-text">
      <span>{displayedContent()}</span>
      <Show when={props.part.isStreaming}>
        <span class="typing-cursor" />
      </Show>
    </div>
  )
}
```

#### Deferred Syntax Highlighting

```typescript
// Highlight code blocks after streaming completes
function CodeBlock(props: { code: string, lang: string, isStreaming: boolean }) {
  const [highlighted, setHighlighted] = createSignal<string | null>(null)
  
  createEffect(() => {
    if (!props.isStreaming && !highlighted()) {
      // Defer highlighting to idle callback
      requestIdleCallback(async () => {
        const html = await highlightCode(props.code, props.lang)
        setHighlighted(html)
      })
    }
  })
  
  return (
    <pre class="code-block">
      <Show 
        when={highlighted()}
        fallback={<code>{props.code}</code>}
      >
        <code innerHTML={highlighted()} />
      </Show>
    </pre>
  )
}
```

#### Smart Scroll Anchoring

```typescript
interface ScrollAnchor {
  mode: 'bottom' | 'message' | 'manual'
  anchorMessageId?: string
  offset?: number
}

function useSmartScroll(containerRef: Ref<HTMLElement>) {
  const [anchor, setAnchor] = createSignal<ScrollAnchor>({ mode: 'bottom' })
  
  // Detect user scroll intent
  const handleScroll = () => {
    const container = containerRef()
    if (!container) return
    
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    
    if (isNearBottom) {
      setAnchor({ mode: 'bottom' })
    } else {
      // Find visible message to anchor to
      const visibleMessage = findVisibleMessage(container)
      setAnchor({ mode: 'message', anchorMessageId: visibleMessage.id })
    }
  }
  
  // Restore anchor after content change
  const restoreAnchor = () => {
    const container = containerRef()
    const currentAnchor = anchor()
    
    if (currentAnchor.mode === 'bottom') {
      container.scrollTop = container.scrollHeight
    } else if (currentAnchor.mode === 'message') {
      const element = document.getElementById(`msg-${currentAnchor.anchorMessageId}`)
      element?.scrollIntoView({ block: 'start' })
    }
  }
  
  return { anchor, handleScroll, restoreAnchor }
}
```

---

## 7. Context-Aware Agent Integration

### Agent Specialization Framework

```typescript
interface AgentContext {
  type: 'coding' | 'writing' | 'research' | 'review' | 'publishing'
  project: ProjectInfo
  activeFiles: FileContext[]
  recentActions: ActionHistory[]
  userPreferences: AgentPreferences
}

interface SpecializedAgent {
  name: string
  description: string
  contextRequirements: ContextRequirement[]
  tools: ToolDefinition[]
  systemPrompt: (context: AgentContext) => string
  suggestedActions: (context: AgentContext) => SuggestedAction[]
}
```

### Built-in Agents

#### Code Agent (Default)

```typescript
const codeAgent: SpecializedAgent = {
  name: 'code',
  description: 'General-purpose coding assistant',
  contextRequirements: [
    { type: 'project', required: true },
    { type: 'files', maxCount: 50 },
  ],
  tools: ['read', 'write', 'edit', 'bash', 'glob', 'grep'],
  systemPrompt: (ctx) => `You are a coding assistant for ${ctx.project.name}...`,
  suggestedActions: (ctx) => [
    { label: 'Fix errors', prompt: 'Fix any type errors or linting issues' },
    { label: 'Add tests', prompt: 'Write tests for recent changes' },
  ],
}
```

#### Review Agent

```typescript
const reviewAgent: SpecializedAgent = {
  name: 'review',
  description: 'Code review and quality analysis',
  contextRequirements: [
    { type: 'diff', required: true },
    { type: 'project', required: true },
  ],
  tools: ['read', 'grep', 'diff'],
  systemPrompt: (ctx) => `Review the following changes...`,
  suggestedActions: (ctx) => [
    { label: 'Review PR', prompt: 'Review the current pull request' },
    { label: 'Security audit', prompt: 'Check for security vulnerabilities' },
  ],
}
```

#### Writing Agent

```typescript
const writingAgent: SpecializedAgent = {
  name: 'writer',
  description: 'Content and documentation writing',
  contextRequirements: [
    { type: 'document', required: true },
    { type: 'outline', optional: true },
  ],
  tools: ['read', 'write', 'webfetch'],
  systemPrompt: (ctx) => `You are a writing assistant. Current document: ${ctx.document.title}...`,
  suggestedActions: (ctx) => [
    { label: 'Expand section', prompt: 'Expand the current section with more detail' },
    { label: 'Improve clarity', prompt: 'Improve the clarity and readability' },
  ],
}
```

#### Publishing Agent

```typescript
const publishingAgent: SpecializedAgent = {
  name: 'publisher',
  description: 'Book and content publishing workflow',
  contextRequirements: [
    { type: 'manuscript', required: true },
    { type: 'chapters', required: true },
  ],
  tools: ['read', 'write', 'webfetch', 'publish'],
  systemPrompt: (ctx) => `You are assisting with publishing "${ctx.manuscript.title}"...`,
  suggestedActions: (ctx) => [
    { label: 'Generate TOC', prompt: 'Generate a table of contents' },
    { label: 'Check consistency', prompt: 'Check for narrative consistency across chapters' },
    { label: 'Format for export', prompt: 'Prepare the manuscript for export' },
  ],
}
```

### Agent Context Sidebar

```typescript
// In Assistant Panel
function AgentContextView(props: { agent: SpecializedAgent, context: AgentContext }) {
  return (
    <div class="agent-context">
      <AgentHeader agent={props.agent} />
      
      <section class="context-files">
        <h4>Active Context</h4>
        <For each={props.context.activeFiles}>
          {(file) => <FileChip file={file} />}
        </For>
      </section>
      
      <section class="suggested-actions">
        <h4>Suggested Actions</h4>
        <For each={props.agent.suggestedActions(props.context)}>
          {(action) => (
            <ActionButton 
              label={action.label}
              onClick={() => submitPrompt(action.prompt)}
            />
          )}
        </For>
      </section>
      
      <section class="recent-history">
        <h4>Recent Actions</h4>
        <ActionTimeline actions={props.context.recentActions} />
      </section>
    </div>
  )
}
```

---

## 8. Book Writing & Publishing Mode

### Overview

Publishing Mode transforms Genesis Console into a book/content authoring environment, providing:
- Chapter-based project structure
- Manuscript management
- Writing assistance with narrative continuity
- Export to multiple formats (MD, PDF, EPUB, HTML)
- Version control integration

### Publishing Mode Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Publishing Mode Layout                          │
├───────────────┬────────────────────────────────┬────────────────────┤
│  MANUSCRIPT   │         EDITOR                 │   PUBLISHING       │
│  NAVIGATOR    │                                │   ASSISTANT        │
├───────────────┼────────────────────────────────┼────────────────────┤
│               │                                │                    │
│ Manuscript    │  ┌──────────────────────────┐ │ Agent: publisher   │
│ └── metadata  │  │ [Edit] [Preview] [Both]  │ │                    │
│               │  └──────────────────────────┘ │ ┌────────────────┐ │
│ Chapters      │                                │ │ Chapter Stats  │ │
│ ├── Ch 1      │  ┌──────────────────────────┐ │ │ Words: 2,450   │ │
│ │   ├── 1.1   │  │                          │ │ │ Reading: 12min │ │
│ │   └── 1.2   │  │   Markdown Editor        │ │ └────────────────┘ │
│ ├── Ch 2      │  │   or                     │ │                    │
│ └── Ch 3      │  │   Split View             │ │ ┌────────────────┐ │
│               │  │                          │ │ │ Suggestions    │ │
│ Appendices    │  │                          │ │ │ - Expand intro │ │
│ └── A. Refs   │  │                          │ │ │ - Add example  │ │
│               │  └──────────────────────────┘ │ └────────────────┘ │
│ Resources     │                                │                    │
│ ├── images/   │  ┌──────────────────────────┐ │ ┌────────────────┐ │
│ └── data/     │  │   Writing Prompt         │ │ │ Export Options │ │
│               │  └──────────────────────────┘ │ │ [PDF] [EPUB]   │ │
└───────────────┴────────────────────────────────┴────────────────────┘
```

### Manuscript Data Model

```typescript
interface Manuscript {
  id: string
  title: string
  subtitle?: string
  author: Author
  metadata: ManuscriptMetadata
  structure: ManuscriptStructure
  settings: PublishingSettings
  createdAt: Date
  updatedAt: Date
}

interface ManuscriptMetadata {
  description?: string
  genre?: string
  keywords: string[]
  language: string
  copyright?: string
  isbn?: string
}

interface ManuscriptStructure {
  frontMatter: FrontMatterSection[]  // Title, copyright, dedication, TOC
  chapters: Chapter[]
  backMatter: BackMatterSection[]    // Appendices, glossary, index
}

interface Chapter {
  id: string
  number: number
  title: string
  sections: Section[]
  status: 'draft' | 'review' | 'final'
  wordCount: number
  targetWordCount?: number
  notes: string[]
}

interface Section {
  id: string
  number: string           // e.g., "1.1", "1.2"
  title?: string
  content: string          // Markdown content
  status: 'draft' | 'review' | 'final'
}

interface PublishingSettings {
  outputFormats: OutputFormat[]
  styling: StylingConfig
  exportPath: string
}
```

### Publishing Mode Components

```
components/publishing/
├── publishing-mode.tsx           (mode entry point)
├── manuscript/
│   ├── manuscript-navigator.tsx  (chapter tree)
│   ├── manuscript-metadata.tsx   (title, author, etc.)
│   ├── chapter-card.tsx          (chapter list item)
│   └── section-item.tsx          (section list item)
├── editor/
│   ├── manuscript-editor.tsx     (main editor)
│   ├── markdown-editor.tsx       (text editing)
│   ├── preview-pane.tsx          (rendered preview)
│   ├── split-view.tsx            (edit + preview)
│   └── writing-toolbar.tsx       (formatting tools)
├── assistant/
│   ├── publishing-assistant.tsx  (right panel)
│   ├── chapter-stats.tsx         (word count, reading time)
│   ├── writing-suggestions.tsx   (AI suggestions)
│   ├── consistency-checker.tsx   (narrative analysis)
│   └── export-panel.tsx          (export options)
└── export/
    ├── export-dialog.tsx         (export configuration)
    ├── pdf-exporter.ts           (PDF generation)
    ├── epub-exporter.ts          (EPUB generation)
    └── html-exporter.ts          (HTML/web export)
```

### Writing Assistant Features

#### Narrative Continuity

```typescript
interface NarrativeContext {
  characters: Character[]
  locations: Location[]
  timeline: TimelineEvent[]
  themes: Theme[]
  plotThreads: PlotThread[]
}

// The publishing agent maintains narrative context
function analyzeNarrativeContinuity(
  manuscript: Manuscript,
  currentChapter: Chapter
): ContinuityReport {
  return {
    characterAppearances: trackCharacterMentions(manuscript, currentChapter),
    timelineConsistency: validateTimeline(manuscript, currentChapter),
    plotProgress: analyzeplotThreads(manuscript, currentChapter),
    suggestions: generateContinuitySuggestions(manuscript, currentChapter),
  }
}
```

#### Writing Prompts

```typescript
const publishingPrompts = {
  expand: (section: Section) => 
    `Expand this section with more detail, maintaining the established voice:\n\n${section.content}`,
  
  simplify: (section: Section) =>
    `Simplify this section for clarity without losing meaning:\n\n${section.content}`,
  
  dialogue: (context: string) =>
    `Write natural dialogue for this scene:\n\n${context}`,
  
  transition: (fromSection: Section, toSection: Section) =>
    `Write a smooth transition between these sections:\n\nFrom: ${fromSection.content}\n\nTo: ${toSection.content}`,
  
  outline: (chapter: Chapter) =>
    `Suggest a detailed outline for chapter "${chapter.title}" with the following structure:\n\n${JSON.stringify(chapter.sections)}`,
}
```

#### Export Pipeline

```typescript
interface ExportPipeline {
  preprocess: (manuscript: Manuscript) => ProcessedManuscript
  render: (processed: ProcessedManuscript, format: OutputFormat) => Buffer
  postprocess: (buffer: Buffer, settings: ExportSettings) => Buffer
  write: (buffer: Buffer, path: string) => Promise<void>
}

// Example: PDF export
const pdfExporter: ExportPipeline = {
  preprocess: (manuscript) => ({
    ...manuscript,
    chapters: manuscript.structure.chapters.map(processChapter),
    styles: loadPdfStyles(manuscript.settings.styling),
  }),
  
  render: async (processed, format) => {
    const html = renderToHtml(processed)
    const pdf = await htmlToPdf(html, format.options)
    return pdf
  },
  
  postprocess: (buffer, settings) => {
    if (settings.addPageNumbers) buffer = addPageNumbers(buffer)
    if (settings.addToc) buffer = generateToc(buffer)
    return buffer
  },
  
  write: async (buffer, path) => {
    await fs.writeFile(path, buffer)
  },
}
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Establish modular architecture without breaking existing functionality

| Task | Priority | Est. Days |
|------|----------|-----------|
| Extract panel components from instance-shell2 | High | 3 |
| Create NavigatorPanel shell | High | 2 |
| Create WorkspacePanel shell | High | 2 |
| Create AssistantPanel shell | High | 2 |
| Implement panel communication bus | High | 2 |
| Add permission queue to AssistantPanel (Issue #52) | High | 2 |
| Update responsive breakpoints | Medium | 2 |

**Deliverable:** Same functionality, cleaner architecture

### Phase 2: Performance (Weeks 4-5)

**Goal:** Optimize bundle size and render performance

| Task | Priority | Est. Days |
|------|----------|-----------|
| Implement code splitting for modes | High | 2 |
| Lazy load dialogs | High | 1 |
| Replace SUID with lightweight components | Medium | 3 |
| Implement virtual scrolling for messages | High | 2 |
| Optimize memo dependencies | Medium | 2 |
| Add request batching | Medium | 2 |

**Deliverable:** 50% reduction in initial bundle, smoother scrolling

### Phase 3: Multi-Surface (Weeks 6-8)

**Goal:** Add mobile and desktop-optimized layouts

| Task | Priority | Est. Days |
|------|----------|-----------|
| Create platform adapter interface | High | 2 |
| Implement web adapter | High | 1 |
| Implement Tauri adapter | High | 2 |
| Create mobile layout components | High | 4 |
| Add gesture support | Medium | 2 |
| Implement mobile prompt input | High | 2 |
| Add bottom navigation | High | 1 |
| Desktop menu integration | Medium | 2 |

**Deliverable:** Responsive UI across all surfaces

### Phase 4: Streaming Improvements (Weeks 9-10)

**Goal:** Smooth, performant chat streaming

| Task | Priority | Est. Days |
|------|----------|-----------|
| Implement streaming text animation | High | 2 |
| Deferred syntax highlighting | High | 2 |
| Smart scroll anchoring | High | 2 |
| SSE connection multiplexing | Medium | 2 |
| Add typing indicators | Low | 1 |

**Deliverable:** Buttery-smooth chat experience

### Phase 5: Agent Integration (Weeks 11-12)

**Goal:** Context-aware specialized agents

| Task | Priority | Est. Days |
|------|----------|-----------|
| Define agent context framework | High | 2 |
| Implement code agent | High | 2 |
| Implement review agent | Medium | 2 |
| Implement writing agent | High | 2 |
| Add suggested actions UI | Medium | 2 |
| Agent context sidebar | Medium | 2 |

**Deliverable:** Specialized agents with context awareness

### Phase 6: Publishing Mode (Weeks 13-16)

**Goal:** Full book writing and publishing capability

| Task | Priority | Est. Days |
|------|----------|-----------|
| Manuscript data model | High | 2 |
| Manuscript navigator | High | 3 |
| Chapter editor | High | 4 |
| Preview pane | High | 2 |
| Publishing agent | High | 3 |
| Chapter statistics | Medium | 1 |
| Narrative continuity checker | Medium | 3 |
| Export to Markdown | High | 2 |
| Export to PDF | Medium | 3 |
| Export to EPUB | Low | 3 |

**Deliverable:** Complete publishing workflow

### Summary Timeline

```
Week 1-3:   Foundation (Panel Architecture)
Week 4-5:   Performance Optimization
Week 6-8:   Multi-Surface Support
Week 9-10:  Streaming Improvements
Week 11-12: Agent Integration
Week 13-16: Publishing Mode

Total: 16 weeks (4 months)
```

### Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Initial bundle size | 1.9MB | <600KB |
| Time to interactive | ~4s | <2s |
| Component file size (max) | 1437 lines | <400 lines |
| Mobile Lighthouse score | N/A | >90 |
| Streaming frame rate | Variable | 60fps |
| Agent context switch time | N/A | <500ms |

---

## Appendix: File Changes Summary

### Files to Create

```
components/
├── navigator/
│   ├── navigator-panel.tsx
│   ├── project-tree.tsx
│   ├── session-tree.tsx
│   ├── chapter-tree.tsx
│   └── file-explorer.tsx
├── workspace/
│   ├── workspace-panel.tsx
│   ├── mode-tabs.tsx
│   └── modes/
│       ├── chat-mode.tsx
│       ├── editor-mode.tsx
│       └── preview-mode.tsx
├── assistant/
│   ├── assistant-panel.tsx
│   ├── permission-queue.tsx
│   └── agent-context.tsx
├── mobile/
│   ├── bottom-navigation.tsx
│   └── mobile-prompt.tsx
├── desktop/
│   └── native-menu-integration.tsx
└── publishing/
    ├── publishing-mode.tsx
    ├── manuscript/
    ├── editor/
    └── export/

platform/
├── adapter.ts
├── web-adapter.ts
├── tauri-adapter.ts
└── types.ts

agents/
├── agent-framework.ts
├── code-agent.ts
├── review-agent.ts
├── writing-agent.ts
└── publishing-agent.ts
```

### Files to Refactor

```
instance-shell2.tsx → Split into navigator, workspace, assistant panels
prompt-input.tsx → Extract to workspace/input/
message-section.tsx → Refactor as workspace/modes/chat-mode.tsx
message-block.tsx → Extract card components
preferences.tsx → Add publishing preferences
```

### Files to Delete (After Refactor)

```
instance-shell2.tsx (replaced by panel components)
```

---

*This document will be updated as implementation progresses.*
