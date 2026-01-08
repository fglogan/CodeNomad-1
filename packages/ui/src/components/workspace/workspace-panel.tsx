/**
 * Workspace Panel Component
 * 
 * Central content area containing:
 * - Mode tabs (Chat, Editor, Preview - future)
 * - Session content view
 * - Message stream
 * - Prompt input
 * 
 * Extracted from instance-shell2.tsx for modular architecture.
 */

import { For, Show, type Component } from "solid-js"
import Box from "@suid/material/Box"
import type { Session } from "../../types/session"
import SessionView from "../session/session-view"
import InfoView from "../info-view"

export interface WorkspacePanelProps {
  /** Instance ID */
  instanceId: string
  /** Instance folder path */
  instanceFolder: string
  /** List of cached session IDs to render */
  cachedSessionIds: string[]
  /** Currently active session ID */
  activeSessionId: string | null
  /** Map of active sessions */
  activeSessions: Map<string, Session>
  /** Whether escape key is in debounce */
  escapeInDebounce: boolean
  /** Whether to show embedded sidebar toggle */
  showSidebarToggle: boolean
  /** Callback when sidebar toggle is clicked */
  onSidebarToggle: () => void
}

const WorkspacePanel: Component<WorkspacePanelProps> = (props) => {
  const showingInfoView = () => props.activeSessionId === "info"
  const hasCachedSessions = () => props.cachedSessionIds.length > 0 && props.activeSessionId

  return (
    <Box
      component="main"
      sx={{ flexGrow: 1, minHeight: 0, display: "flex", flexDirection: "column", overflowX: "hidden" }}
      class="content-area"
    >
      <Show
        when={showingInfoView()}
        fallback={
          <Show
            when={hasCachedSessions()}
            fallback={
              <div class="flex items-center justify-center h-full">
                <div class="text-center text-gray-500 dark:text-gray-400">
                  <p class="mb-2">No session selected</p>
                  <p class="text-sm">Select a session to view messages</p>
                </div>
              </div>
            }
          >
            <For each={props.cachedSessionIds}>
              {(sessionId) => {
                const isActive = () => props.activeSessionId === sessionId
                return (
                  <div
                    class="session-cache-pane flex flex-col flex-1 min-h-0"
                    style={{ display: isActive() ? "flex" : "none" }}
                    data-session-id={sessionId}
                    aria-hidden={!isActive()}
                  >
                    <SessionView
                      sessionId={sessionId}
                      activeSessions={props.activeSessions}
                      instanceId={props.instanceId}
                      instanceFolder={props.instanceFolder}
                      escapeInDebounce={props.escapeInDebounce}
                      showSidebarToggle={props.showSidebarToggle}
                      onSidebarToggle={props.onSidebarToggle}
                      forceCompactStatusLayout={props.showSidebarToggle}
                      isActive={isActive()}
                    />
                  </div>
                )
              }}
            </For>
          </Show>
        }
      >
        <div class="info-view-pane flex flex-col flex-1 min-h-0 overflow-y-auto">
          <InfoView instanceId={props.instanceId} />
        </div>
      </Show>
    </Box>
  )
}

export default WorkspacePanel
