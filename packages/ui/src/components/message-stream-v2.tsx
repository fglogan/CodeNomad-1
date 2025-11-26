import { For, Show, createMemo, createSignal, createEffect, onCleanup } from "solid-js"
import MessageItem from "./message-item"
import ToolCall from "./tool-call"
import Kbd from "./kbd"
import type { MessageInfo, ClientPart } from "../types/message"
import { getSessionInfo, sessions, setActiveParentSession, setActiveSession } from "../stores/sessions"
import { showCommandPalette } from "../stores/command-palette"
import { messageStoreBus } from "../stores/message-v2/bus"
import type { MessageRecord } from "../stores/message-v2/types"
import { buildRecordDisplayData, clearRecordDisplayCacheForInstance, type ToolCallPart } from "../stores/message-v2/record-display-cache"
import { useConfig } from "../stores/preferences"
import { sseManager } from "../lib/sse-manager"
import { formatTokenTotal } from "../lib/formatters"
import { useScrollCache } from "../lib/hooks/use-scroll-cache"
import { setActiveInstanceId } from "../stores/instances"

const SCROLL_SCOPE = "session"

const TOOL_ICON = "🔧"
const codeNomadLogo = new URL("../images/CodeNomad-Icon.png", import.meta.url).href

const messageItemCache = new Map<string, MessageDisplayItem>()
const toolItemCache = new Map<string, ToolDisplayItem>()

type ToolState = import("@opencode-ai/sdk").ToolState
type ToolStateRunning = import("@opencode-ai/sdk").ToolStateRunning
type ToolStateCompleted = import("@opencode-ai/sdk").ToolStateCompleted
type ToolStateError = import("@opencode-ai/sdk").ToolStateError

function isToolStateRunning(state: ToolState | undefined): state is ToolStateRunning {
  return Boolean(state && state.status === "running")
}

function isToolStateCompleted(state: ToolState | undefined): state is ToolStateCompleted {
  return Boolean(state && state.status === "completed")
}

function isToolStateError(state: ToolState | undefined): state is ToolStateError {
  return Boolean(state && state.status === "error")
}

function extractTaskSessionId(state: ToolState | undefined): string {
  if (!state) return ""
  const metadata = (state as unknown as { metadata?: Record<string, unknown> }).metadata ?? {}
  const directId = metadata?.sessionId ?? metadata?.sessionID
  return typeof directId === "string" ? directId : ""
}

interface TaskSessionLocation {
  sessionId: string
  instanceId: string
  parentId: string | null
}

function findTaskSessionLocation(sessionId: string): TaskSessionLocation | null {
  if (!sessionId) return null
  const allSessions = sessions()
  for (const [instanceId, sessionMap] of allSessions) {
    const session = sessionMap?.get(sessionId)
    if (session) {
      return {
        sessionId: session.id,
        instanceId,
        parentId: session.parentId ?? null,
      }
    }
  }
  return null
}

function navigateToTaskSession(location: TaskSessionLocation) {
  setActiveInstanceId(location.instanceId)
  const parentToActivate = location.parentId ?? location.sessionId
  setActiveParentSession(location.instanceId, parentToActivate)
  if (location.parentId) {
    setActiveSession(location.instanceId, location.sessionId)
  }
}

function formatTokens(tokens: number): string {
  return formatTokenTotal(tokens)
}

function makeInstanceCacheKey(instanceId: string, id: string) {
  return `${instanceId}:${id}`
}

function clearInstanceCaches(instanceId: string) {

  clearRecordDisplayCacheForInstance(instanceId)
  const prefix = `${instanceId}:`
  for (const key of messageItemCache.keys()) {
    if (key.startsWith(prefix)) {
      messageItemCache.delete(key)
    }
  }
  for (const key of toolItemCache.keys()) {
    if (key.startsWith(prefix)) {
      toolItemCache.delete(key)
    }
  }
}

messageStoreBus.onInstanceDestroyed(clearInstanceCaches)

interface MessageStreamV2Props {
  instanceId: string
  sessionId: string
  loading?: boolean
  onRevert?: (messageId: string) => void
  onFork?: (messageId?: string) => void
}

interface MessageDisplayItem {
  type: "message"
  record: MessageRecord
  combinedParts: ClientPart[]
  orderedParts: ClientPart[]
  messageInfo?: MessageInfo
  isQueued: boolean
}

interface ToolDisplayItem {
  type: "tool"
  key: string
  toolPart: ToolCallPart
  messageInfo?: MessageInfo
  messageId: string
  messageVersion: number
  partVersion: number
}

interface MessageDisplayBlock {
  record: MessageRecord
  messageItem: MessageDisplayItem | null
  toolItems: ToolDisplayItem[]
}

function hasRenderableContent(record: MessageRecord, combinedParts: ClientPart[], info?: MessageInfo): boolean {
  if (record.role !== "assistant" && record.role !== "user") {
    return false
  }
  if (record.role !== "assistant" || combinedParts.length > 0) {
    return true
  }
  if (info && info.role === "assistant" && info.error) {
    return true
  }
  return record.status === "error"
}

export default function MessageStreamV2(props: MessageStreamV2Props) {
  const { preferences } = useConfig()
  const store = createMemo(() => messageStoreBus.getOrCreate(props.instanceId))
  const messageIds = createMemo(() => store().getSessionMessageIds(props.sessionId))
  const messageRecords = createMemo(() =>
    messageIds()
      .map((id) => store().getMessage(id))
      .filter((record): record is MessageRecord => Boolean(record)),
  )

  const sessionRevision = createMemo(() => store().getSessionRevision(props.sessionId))
  const usageSnapshot = createMemo(() => store().getSessionUsage(props.sessionId))
  const sessionInfo = createMemo(() =>
    getSessionInfo(props.instanceId, props.sessionId) ?? {
      cost: 0,
      contextWindow: 0,
      isSubscriptionModel: false,
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      actualUsageTokens: 0,
      modelOutputLimit: 0,
      contextAvailableTokens: null,
    },
  )
  const tokenStats = createMemo(() => {
    const usage = usageSnapshot()
    const info = sessionInfo()
    return {
      used: usage?.actualUsageTokens ?? info.actualUsageTokens ?? 0,
      avail: info.contextAvailableTokens,
    }
  })

  const connectionStatus = () => sseManager.getStatus(props.instanceId)
  const handleCommandPaletteClick = () => {
    showCommandPalette(props.instanceId)
  }

  const messageInfoMap = createMemo(() => {
    const map = new Map<string, MessageInfo>()
    messageRecords().forEach((record) => {
      const info = store().getMessageInfo(record.id)
      if (info) {
        map.set(record.id, info)
      }
    })
    return map
  })
  const revertTarget = createMemo(() => store().getSessionRevert(props.sessionId))

  const messageIndexMap = createMemo(() => {
    const map = new Map<string, number>()
    const records = messageRecords()
    records.forEach((record, index) => map.set(record.id, index))
    return map
  })

  const lastAssistantIndex = createMemo(() => {
    const records = messageRecords()
    for (let index = records.length - 1; index >= 0; index--) {
      if (records[index].role === "assistant") {
        return index
      }
    }
    return -1
  })

  const displayBlocks = createMemo<MessageDisplayBlock[]>(() => {
    const infoMap = messageInfoMap()
    const showThinking = preferences().showThinkingBlocks
    const revert = revertTarget()
    const instanceId = props.instanceId
    const blocks: MessageDisplayBlock[] = []
    const usedMessageKeys = new Set<string>()
    const usedToolKeys = new Set<string>()
    const records = messageRecords()
    const assistantIndex = lastAssistantIndex()
    const indexMap = messageIndexMap()

    for (const record of records) {
      if (revert?.messageID && record.id === revert.messageID) {
        break
      }

      const { orderedParts, textAndReasoningParts, toolParts } = buildRecordDisplayData(instanceId, record, showThinking)
      const messageInfo = infoMap.get(record.id)
      const recordCacheKey = makeInstanceCacheKey(instanceId, record.id)
      const recordIndex = indexMap.get(record.id) ?? 0
      const isQueued = record.role === "user" && (assistantIndex === -1 || recordIndex > assistantIndex)

      let messageItem: MessageDisplayItem | null = null
      if (hasRenderableContent(record, textAndReasoningParts, messageInfo)) {
        let cached = messageItemCache.get(recordCacheKey)
        if (!cached) {
          cached = {
            type: "message",
            record,
            combinedParts: textAndReasoningParts,
            orderedParts,
            messageInfo,
            isQueued,
          }
          messageItemCache.set(recordCacheKey, cached)
        } else {
          cached.record = record
          cached.combinedParts = textAndReasoningParts
          cached.orderedParts = orderedParts
          cached.messageInfo = messageInfo
          cached.isQueued = isQueued
        }
        messageItem = cached
        usedMessageKeys.add(recordCacheKey)
      }

      const toolItems: ToolDisplayItem[] = []
      toolParts.forEach((toolPart, toolIndex) => {
        const partVersion = typeof toolPart.version === "number" ? toolPart.version : 0
        const messageVersion = record.revision
        const key = `${record.id}:${toolPart.id ?? toolIndex}`
        const cacheKey = makeInstanceCacheKey(instanceId, key)
        let toolItem = toolItemCache.get(cacheKey)
        if (!toolItem) {
          toolItem = {
            type: "tool",
            key,
            toolPart,
            messageInfo,
            messageId: record.id,
            messageVersion,
            partVersion,
          }
          toolItemCache.set(cacheKey, toolItem)
        } else {
          toolItem.key = key
          toolItem.toolPart = toolPart
          toolItem.messageInfo = messageInfo
          toolItem.messageId = record.id
          toolItem.messageVersion = messageVersion
          toolItem.partVersion = partVersion
        }
        toolItems.push(toolItem)
        usedToolKeys.add(cacheKey)
      })

      if (!messageItem && toolItems.length === 0) {
        continue
      }

      blocks.push({ record, messageItem, toolItems })
    }

    for (const key of messageItemCache.keys()) {
      if (!usedMessageKeys.has(key)) {
        messageItemCache.delete(key)
      }
    }
    for (const key of toolItemCache.keys()) {
      if (!usedToolKeys.has(key)) {
        toolItemCache.delete(key)
      }
    }

    return blocks
  })

  const changeToken = createMemo(() => {
    const revisionValue = sessionRevision()
    const blocks = displayBlocks()
    if (blocks.length === 0) {
      return `${revisionValue}:empty`
    }
    const lastBlock = blocks[blocks.length - 1]
    const lastTool = lastBlock.toolItems[lastBlock.toolItems.length - 1]
    const tailSignature = lastTool
      ? `tool:${lastTool.key}:${lastTool.partVersion}`
      : `msg:${lastBlock.record.id}:${lastBlock.record.revision}`
    return `${revisionValue}:${tailSignature}`
  })

  const scrollCache = useScrollCache({
    instanceId: () => props.instanceId,
    sessionId: () => props.sessionId,
    scope: SCROLL_SCOPE,
  })

  const [autoScroll, setAutoScroll] = createSignal(true)
  const [showScrollTopButton, setShowScrollTopButton] = createSignal(false)
  const [showScrollBottomButton, setShowScrollBottomButton] = createSignal(false)
  let containerRef: HTMLDivElement | undefined

  function isNearBottom(element: HTMLDivElement, offset = 48) {
    const { scrollTop, scrollHeight, clientHeight } = element
    return scrollHeight - (scrollTop + clientHeight) <= offset
  }

  function isNearTop(element: HTMLDivElement, offset = 48) {
    return element.scrollTop <= offset
  }

  function updateScrollIndicators(element: HTMLDivElement) {
    const hasItems = displayBlocks().length > 0
    setShowScrollBottomButton(hasItems && !isNearBottom(element))
    setShowScrollTopButton(hasItems && !isNearTop(element))
  }

  function scrollToBottom(immediate = false) {
    if (!containerRef) return
    const behavior = immediate ? "auto" : "smooth"
    containerRef.scrollTo({ top: containerRef.scrollHeight, behavior })
    setAutoScroll(true)
    requestAnimationFrame(() => {
      if (!containerRef) return
      updateScrollIndicators(containerRef)
      persistScrollState()
    })
  }

  function scrollToTop(immediate = false) {
    if (!containerRef) return
    const behavior = immediate ? "auto" : "smooth"
    setAutoScroll(false)
    containerRef.scrollTo({ top: 0, behavior })
    requestAnimationFrame(() => {
      if (!containerRef) return
      updateScrollIndicators(containerRef)
      persistScrollState()
    })
  }

  function persistScrollState() {
    if (!containerRef) return
    scrollCache.persist(containerRef, { atBottomOffset: 48 })
  }

  function handleScroll(event: Event) {
    if (!containerRef) return
    updateScrollIndicators(containerRef)
    if (event.isTrusted) {
      const atBottom = isNearBottom(containerRef)
      if (!atBottom) {
        setAutoScroll(false)
      } else {
        setAutoScroll(true)
      }
    }
    persistScrollState()
  }

  createEffect(() => {
    const target = containerRef
    if (!target) return
    scrollCache.restore(target, {
      fallback: () => scrollToBottom(true),
      onApplied: (snapshot) => {
        if (snapshot) {
          setAutoScroll(snapshot.atBottom)
        } else {
          const atBottom = isNearBottom(target)
          setAutoScroll(atBottom)
        }
        updateScrollIndicators(target)
      },
    })
  })

  let previousToken: string | undefined
  createEffect(() => {
    const token = changeToken()
    if (!token || token === previousToken) {
      return
    }
    previousToken = token
    if (autoScroll()) {
      requestAnimationFrame(() => scrollToBottom(true))
    }
  })

  createEffect(() => {
    if (messageRecords().length === 0) {
      setShowScrollTopButton(false)
      setShowScrollBottomButton(false)
      setAutoScroll(true)
    }
  })

  onCleanup(() => {
    persistScrollState()
  })

  return (
    <div class="message-stream-container">
      <div class="connection-status">
        <div class="connection-status-text connection-status-info flex flex-wrap items-center gap-2 text-sm font-medium">
          <div class="inline-flex items-center gap-1 rounded-full border border-base px-2 py-0.5 text-xs text-primary">
            <span class="uppercase text-[10px] tracking-wide text-primary/70">Used</span>
            <span class="font-semibold text-primary">{formatTokens(tokenStats().used)}</span>
          </div>
          <div class="inline-flex items-center gap-1 rounded-full border border-base px-2 py-0.5 text-xs text-primary">
            <span class="uppercase text-[10px] tracking-wide text-primary/70">Avail</span>
            <span class="font-semibold text-primary">
              {sessionInfo().contextAvailableTokens !== null ? formatTokens(sessionInfo().contextAvailableTokens ?? 0) : "--"}
            </span>
          </div>
        </div>

        <div class="connection-status-text connection-status-shortcut">
          <div class="connection-status-shortcut-action">
            <button type="button" class="connection-status-button" onClick={handleCommandPaletteClick} aria-label="Open command palette">
              Command Palette
            </button>
            <span class="connection-status-shortcut-hint">
              <Kbd shortcut="cmd+shift+p" />
            </span>
          </div>
        </div>
        <div class="connection-status-meta flex items-center justify-end gap-3">
          <Show when={connectionStatus() === "connected"}>
            <span class="status-indicator connected">
              <span class="status-dot" />
              Connected
            </span>
          </Show>
          <Show when={connectionStatus() === "connecting"}>
            <span class="status-indicator connecting">
              <span class="status-dot" />
              Connecting...
            </span>
          </Show>
          <Show when={connectionStatus() === "error" || connectionStatus() === "disconnected"}>
            <span class="status-indicator disconnected">
              <span class="status-dot" />
              Disconnected
            </span>
          </Show>
        </div>
      </div>

      <div
        class="message-stream"
        ref={(element) => {
          containerRef = element || undefined
        }}
        onScroll={handleScroll}
      >
        <Show when={!props.loading && displayBlocks().length === 0}>
          <div class="empty-state">
            <div class="empty-state-content">
              <div class="flex flex-col items-center gap-3 mb-6">
                <img src={codeNomadLogo} alt="CodeNomad logo" class="h-48 w-auto" loading="lazy" />
                <h1 class="text-3xl font-semibold text-primary">CodeNomad</h1>
              </div>
              <h3>Start a conversation</h3>
              <p>Type a message below or open the Command Palette:</p>
              <ul>
                <li>
                  <span>Command Palette</span>
                  <Kbd shortcut="cmd+shift+p" class="ml-2" />
                </li>
                <li>Ask about your codebase</li>
                <li>
                  Attach files with <code>@</code>
                </li>
              </ul>
            </div>
          </div>
        </Show>

        <Show when={props.loading}>
          <div class="loading-state">
            <div class="spinner" />
            <p>Loading messages...</p>
          </div>
        </Show>

        <For each={displayBlocks()}>
          {(block) => (
            <div class="message-stream-block" data-message-id={block.record.id}>
              <Show when={block.messageItem} keyed>
                {(message) => (
                  <MessageItem
                    record={message.record}
                    messageInfo={message.messageInfo}
                    combinedParts={message.combinedParts}
                    orderedParts={message.orderedParts}
                    instanceId={props.instanceId}
                    sessionId={props.sessionId}
                    isQueued={message.isQueued}
                    onRevert={props.onRevert}
                    onFork={props.onFork}
                  />
                )}
              </Show>

              <For each={block.toolItems}>
                {(item) => {
                  const toolState = item.toolPart.state as ToolState | undefined
                  const hasToolState =
                    Boolean(toolState) && (isToolStateRunning(toolState) || isToolStateCompleted(toolState) || isToolStateError(toolState))
                  const taskSessionId = hasToolState ? extractTaskSessionId(toolState) : ""
                  const taskLocation = taskSessionId ? findTaskSessionLocation(taskSessionId) : null
                  const handleGoToTaskSession = (event: MouseEvent) => {
                    event.preventDefault()
                    event.stopPropagation()
                    if (!taskLocation) return
                    navigateToTaskSession(taskLocation)
                  }

                  return (
                    <div class="tool-call-message" data-key={item.key}>
                      <div class="tool-call-header-label">
                        <div class="tool-call-header-meta">
                          <span class="tool-call-icon">{TOOL_ICON}</span>
                          <span>Tool Call</span>
                          <span class="tool-name">{item.toolPart.tool || "unknown"}</span>
                        </div>
                        <Show when={taskSessionId}>
                          <button
                            class="tool-call-header-button"
                            type="button"
                            disabled={!taskLocation}
                            onClick={handleGoToTaskSession}
                            title={!taskLocation ? "Session not available yet" : "Go to session"}
                          >
                            Go to Session
                          </button>
                        </Show>
                      </div>
                      <ToolCall
                        toolCall={item.toolPart}
                        toolCallId={item.key}
                        messageId={item.messageId}
                        messageVersion={item.messageVersion}
                        partVersion={item.partVersion}
                        instanceId={props.instanceId}
                        sessionId={props.sessionId}
                      />
                    </div>
                  )
                }}
              </For>
            </div>
          )}
        </For>
      </div>

      <Show when={showScrollTopButton() || showScrollBottomButton()}>
        <div class="message-scroll-button-wrapper">
          <Show when={showScrollTopButton()}>
            <button
              type="button"
              class="message-scroll-button"
              onClick={() => scrollToTop()}
              aria-label="Scroll to first message"
            >
              <span class="message-scroll-icon" aria-hidden="true">
                ↑
              </span>
            </button>
          </Show>
          <Show when={showScrollBottomButton()}>
            <button
              type="button"
              class="message-scroll-button"
              onClick={() => scrollToBottom()}
              aria-label="Scroll to latest message"
            >
              <span class="message-scroll-icon" aria-hidden="true">
                ↓
              </span>
            </button>
          </Show>
        </div>
      </Show>
    </div>
  )
}
