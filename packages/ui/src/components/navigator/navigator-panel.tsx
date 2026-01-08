/**
 * Navigator Panel Component
 * 
 * Left sidebar panel containing:
 * - Session list with navigation
 * - Context usage display
 * - Agent selector
 * - Model selector
 * 
 * Extracted from instance-shell2.tsx for modular architecture.
 */

import { Show, type Component } from "solid-js"
import Divider from "@suid/material/Divider"
import IconButton from "@suid/material/IconButton"
import PushPinIcon from "@suid/icons-material/PushPin"
import PushPinOutlinedIcon from "@suid/icons-material/PushPinOutlined"
import type { KeyboardShortcut } from "../../lib/keyboard-registry"
import type { Session } from "../../types/session"
import SessionList from "../session-list"
import KeyboardHint from "../keyboard-hint"
import AgentSelector from "../agent-selector"
import ModelSelector from "../model-selector"
import ContextUsagePanel from "../session/context-usage-panel"
import Kbd from "../kbd"

export interface NavigatorPanelProps {
  /** Instance ID for this navigator */
  instanceId: string
  /** Map of active sessions */
  sessions: Map<string, Session>
  /** Currently selected session ID */
  activeSessionId: string | null
  /** Active session object */
  activeSession: Session | null
  /** Whether the panel is pinned (persistent) */
  isPinned: boolean
  /** Whether to show the pin button */
  showPinButton: boolean
  /** Keyboard shortcuts to display */
  keyboardShortcuts: KeyboardShortcut[]
  /** Ref setter for the content element */
  setContentRef?: (el: HTMLElement | null) => void
  /** Callback when a session is selected */
  onSessionSelect: (sessionId: string) => void
  /** Callback when a session is closed */
  onSessionClose: (sessionId: string) => void
  /** Callback when creating a new session */
  onNewSession: () => void
  /** Callback when toggling pin state */
  onPinToggle: () => void
  /** Callback when agent changes */
  onAgentChange: (sessionId: string, agent: string) => Promise<void>
  /** Callback when model changes */
  onModelChange: (sessionId: string, model: { providerId: string; modelId: string }) => Promise<void>
}

const NavigatorPanel: Component<NavigatorPanelProps> = (props) => {
  return (
    <div class="flex flex-col h-full min-h-0" ref={props.setContentRef}>
      {/* Header */}
      <div class="flex items-start justify-between gap-2 px-4 py-3 border-b border-base">
        <div class="flex flex-col gap-1">
          <span class="session-sidebar-title text-sm font-semibold uppercase text-primary">
            Sessions
          </span>
          <div class="session-sidebar-shortcuts">
            <Show when={props.keyboardShortcuts.length > 0}>
              <KeyboardHint shortcuts={props.keyboardShortcuts} separator=" " showDescription={false} />
            </Show>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Show when={props.showPinButton}>
            <IconButton
              size="small"
              color="inherit"
              aria-label={props.isPinned ? "Unpin left drawer" : "Pin left drawer"}
              onClick={props.onPinToggle}
            >
              {props.isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
            </IconButton>
          </Show>
        </div>
      </div>

      {/* Session List */}
      <div class="session-sidebar flex flex-col flex-1 min-h-0">
        <SessionList
          instanceId={props.instanceId}
          sessions={props.sessions}
          activeSessionId={props.activeSessionId}
          onSelect={props.onSessionSelect}
          onClose={props.onSessionClose}
          onNew={props.onNewSession}
          showHeader={false}
          showFooter={false}
        />

        <Divider />

        {/* Session Controls (visible when session is active) */}
        <Show when={props.activeSession}>
          {(activeSession) => (
            <>
              <ContextUsagePanel instanceId={props.instanceId} sessionId={activeSession().id} />
              <div class="session-sidebar-controls px-4 py-4 border-t border-base flex flex-col gap-3">
                <AgentSelector
                  instanceId={props.instanceId}
                  sessionId={activeSession().id}
                  currentAgent={activeSession().agent}
                  onAgentChange={(agent) => props.onAgentChange(activeSession().id, agent)}
                />

                <div class="sidebar-selector-hints" aria-hidden="true">
                  <span class="hint sidebar-selector-hint sidebar-selector-hint--left">
                    <Kbd shortcut="cmd+shift+a" />
                  </span>
                  <span class="hint sidebar-selector-hint sidebar-selector-hint--right">
                    <Kbd shortcut="cmd+shift+m" />
                  </span>
                </div>

                <ModelSelector
                  instanceId={props.instanceId}
                  sessionId={activeSession().id}
                  currentModel={activeSession().model}
                  onModelChange={(model) => props.onModelChange(activeSession().id, model)}
                />
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  )
}

export default NavigatorPanel
