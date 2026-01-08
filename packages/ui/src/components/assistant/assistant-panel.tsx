/**
 * Assistant Panel Component
 * 
 * Right sidebar panel containing:
 * - Plan/Todo list view
 * - Background processes
 * - MCP server status
 * - LSP server status
 * - Plugins status
 * 
 * Extracted from instance-shell2.tsx for modular architecture.
 */

import { For, Show, createEffect, createSignal, type Component } from "solid-js"
import type { ToolState } from "@opencode-ai/sdk"
import { Accordion } from "@kobalte/core"
import { ChevronDown, TerminalSquare, Trash2, XOctagon } from "lucide-solid"
import Typography from "@suid/material/Typography"
import IconButton from "@suid/material/IconButton"
import PushPinIcon from "@suid/icons-material/PushPin"
import PushPinOutlinedIcon from "@suid/icons-material/PushPinOutlined"
import type { Instance } from "../../types/instance"
import type { BackgroundProcess } from "../../../../server/src/api-types"
import { TodoListView } from "../tool-call/renderers/todo"
import InstanceServiceStatus from "../instance-service-status"
import { serverApi } from "../../lib/api-client"

export interface AssistantPanelProps {
  /** Instance for this panel */
  instance: Instance
  /** Currently active session ID */
  activeSessionId: string | null
  /** Latest todo state from the session */
  latestTodoState: ToolState | null
  /** List of background processes */
  backgroundProcesses: BackgroundProcess[]
  /** Whether the panel is pinned (persistent) */
  isPinned: boolean
  /** Whether to show the pin button */
  showPinButton: boolean
  /** Ref setter for the content element */
  setContentRef?: (el: HTMLElement | null) => void
  /** Callback when toggling pin state */
  onPinToggle: () => void
  /** Callback to open background process output */
  onOpenProcessOutput: (process: BackgroundProcess) => void
}

const AssistantPanel: Component<AssistantPanelProps> = (props) => {
  const [expandedItems, setExpandedItems] = createSignal<string[]>([
    "plan",
    "background-processes",
    "mcp",
    "lsp",
    "plugins",
  ])

  const stopBackgroundProcess = async (processId: string) => {
    try {
      await serverApi.stopBackgroundProcess(props.instance.id, processId)
    } catch (error) {
      console.warn("Failed to stop background process", error)
    }
  }

  const terminateBackgroundProcess = async (processId: string) => {
    try {
      await serverApi.terminateBackgroundProcess(props.instance.id, processId)
    } catch (error) {
      console.warn("Failed to terminate background process", error)
    }
  }

  const renderPlanSectionContent = () => {
    if (!props.activeSessionId || props.activeSessionId === "info") {
      return <p class="text-xs text-secondary">Select a session to view plan.</p>
    }
    if (!props.latestTodoState) {
      return <p class="text-xs text-secondary">Nothing planned yet.</p>
    }
    return <TodoListView state={props.latestTodoState} emptyLabel="Nothing planned yet." showStatusLabel={false} />
  }

  const renderBackgroundProcesses = () => {
    if (props.backgroundProcesses.length === 0) {
      return <p class="text-xs text-secondary">No background processes.</p>
    }

    return (
      <div class="flex flex-col gap-2">
        <For each={props.backgroundProcesses}>
          {(process) => (
            <div class="rounded-md border border-base bg-surface-secondary p-2 flex flex-col gap-2">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-primary">{process.title}</span>
                <div class="flex flex-wrap gap-2 text-[11px] text-secondary">
                  <span>Status: {process.status}</span>
                  <Show when={typeof process.outputSizeBytes === "number"}>
                    <span>Output: {Math.round((process.outputSizeBytes ?? 0) / 1024)}KB</span>
                  </Show>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class="button-tertiary w-full p-1 inline-flex items-center justify-center"
                  onClick={() => props.onOpenProcessOutput(process)}
                  aria-label="Output"
                  title="Output"
                >
                  <TerminalSquare class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="button-tertiary w-full p-1 inline-flex items-center justify-center"
                  disabled={process.status !== "running"}
                  onClick={() => stopBackgroundProcess(process.id)}
                  aria-label="Stop"
                  title="Stop"
                >
                  <XOctagon class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="button-tertiary w-full p-1 inline-flex items-center justify-center"
                  onClick={() => terminateBackgroundProcess(process.id)}
                  aria-label="Terminate"
                  title="Terminate"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </For>
      </div>
    )
  }

  const sections = [
    {
      id: "plan",
      label: "Plan",
      render: renderPlanSectionContent,
    },
    {
      id: "background-processes",
      label: "Background Shells",
      render: renderBackgroundProcesses,
    },
    {
      id: "mcp",
      label: "MCP Servers",
      render: () => (
        <InstanceServiceStatus
          initialInstance={props.instance}
          sections={["mcp"]}
          showSectionHeadings={false}
          class="space-y-2"
        />
      ),
    },
    {
      id: "lsp",
      label: "LSP Servers",
      render: () => (
        <InstanceServiceStatus
          initialInstance={props.instance}
          sections={["lsp"]}
          showSectionHeadings={false}
          class="space-y-2"
        />
      ),
    },
    {
      id: "plugins",
      label: "Plugins",
      render: () => (
        <InstanceServiceStatus
          initialInstance={props.instance}
          sections={["plugins"]}
          showSectionHeadings={false}
          class="space-y-2"
        />
      ),
    },
  ]

  // Ensure all sections are expanded by default
  createEffect(() => {
    const currentExpanded = new Set(expandedItems())
    if (sections.every((section) => currentExpanded.has(section.id))) return
    setExpandedItems(sections.map((section) => section.id))
  })

  const handleAccordionChange = (values: string[]) => {
    setExpandedItems(values)
  }

  const isSectionExpanded = (id: string) => expandedItems().includes(id)

  return (
    <div class="flex flex-col h-full" ref={props.setContentRef}>
      {/* Header */}
      <div class="flex items-center justify-between px-4 py-2 border-b border-base">
        <Typography variant="subtitle2" class="uppercase tracking-wide text-xs font-semibold">
          Status Panel
        </Typography>
        <div class="flex items-center gap-2">
          <Show when={props.showPinButton}>
            <IconButton
              size="small"
              color="inherit"
              aria-label={props.isPinned ? "Unpin right drawer" : "Pin right drawer"}
              onClick={props.onPinToggle}
            >
              {props.isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
            </IconButton>
          </Show>
        </div>
      </div>

      {/* Accordion Sections */}
      <div class="flex-1 overflow-y-auto">
        <Accordion.Root
          class="flex flex-col"
          collapsible
          multiple
          value={expandedItems()}
          onChange={handleAccordionChange}
        >
          <For each={sections}>
            {(section) => (
              <Accordion.Item
                value={section.id}
                class="w-full border border-base bg-surface-secondary text-primary"
              >
                <Accordion.Header>
                  <Accordion.Trigger class="w-full flex items-center justify-between gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
                    <span>{section.label}</span>
                    <ChevronDown
                      class={`h-4 w-4 transition-transform duration-150 ${isSectionExpanded(section.id) ? "rotate-180" : ""}`}
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content class="w-full px-3 pb-3 text-sm text-primary">
                  {section.render()}
                </Accordion.Content>
              </Accordion.Item>
            )}
          </For>
        </Accordion.Root>
      </div>
    </div>
  )
}

export default AssistantPanel
