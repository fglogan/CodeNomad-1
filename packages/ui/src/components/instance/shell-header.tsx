import { Show, type Accessor, type Component, type JSX } from "solid-js"
import AppBar from "@suid/material/AppBar"
import Toolbar from "@suid/material/Toolbar"
import IconButton from "@suid/material/IconButton"
import MenuIcon from "@suid/icons-material/Menu"
import MenuOpenIcon from "@suid/icons-material/MenuOpen"
import Kbd from "../kbd"

type ConnectionStatus = "connecting" | "connected" | "error" | "disconnected" | null
type DrawerViewState = "pinned" | "floating-open" | "floating-closed"

interface ShellHeaderProps {
  isPhoneLayout: boolean
  activeSessionId: string | null
  connectionStatus: ConnectionStatus

  // Token display
  formattedUsedTokens: string
  formattedAvailableTokens: string

  // Left drawer
  leftDrawerState: DrawerViewState
  leftToggleButtonRef: (el: HTMLElement) => void
  onLeftButtonClick: () => void

  // Right drawer
  rightDrawerState: DrawerViewState
  rightToggleButtonRef: (el: HTMLElement) => void
  onRightButtonClick: () => void

  // Command palette
  onCommandPaletteClick: () => void
}

const ShellHeader: Component<ShellHeaderProps> = (props) => {
  const connectionStatusClass = () => {
    const status = props.connectionStatus
    if (status === "connecting") return "connecting"
    if (status === "connected") return "connected"
    return "disconnected"
  }

  const leftAppBarButtonLabel = () => {
    const state = props.leftDrawerState
    if (state === "pinned") return "Left drawer pinned"
    if (state === "floating-closed") return "Open left drawer"
    return "Close left drawer"
  }

  const rightAppBarButtonLabel = () => {
    const state = props.rightDrawerState
    if (state === "pinned") return "Right drawer pinned"
    if (state === "floating-closed") return "Open right drawer"
    return "Close right drawer"
  }

  const leftAppBarButtonIcon = () => {
    const state = props.leftDrawerState
    if (state === "floating-closed") return <MenuIcon fontSize="small" />
    return <MenuOpenIcon fontSize="small" />
  }

  const rightAppBarButtonIcon = () => {
    const state = props.rightDrawerState
    if (state === "floating-closed") return <MenuIcon fontSize="small" sx={{ transform: "scaleX(-1)" }} />
    return <MenuOpenIcon fontSize="small" sx={{ transform: "scaleX(-1)" }} />
  }

  const PhoneLayout = () => (
    <div class="flex flex-col w-full gap-1.5">
      <div class="flex flex-wrap items-center justify-between gap-2 w-full">
        <IconButton
          ref={props.leftToggleButtonRef}
          color="inherit"
          onClick={props.onLeftButtonClick}
          aria-label={leftAppBarButtonLabel()}
          size="small"
          aria-expanded={props.leftDrawerState !== "floating-closed"}
          disabled={props.leftDrawerState === "pinned"}
        >
          {leftAppBarButtonIcon()}
        </IconButton>

        <div class="flex flex-wrap items-center gap-1 justify-center">
          <button
            type="button"
            class="connection-status-button px-2 py-0.5 text-xs"
            onClick={props.onCommandPaletteClick}
            aria-label="Open command palette"
            style={{ flex: "0 0 auto", width: "auto" }}
          >
            Command Palette
          </button>
          <span class="connection-status-shortcut-hint">
            <Kbd shortcut="cmd+shift+p" />
          </span>
          <span
            class={`status-indicator ${connectionStatusClass()}`}
            aria-label={`Connection ${props.connectionStatus}`}
          >
            <span class="status-dot" />
          </span>
        </div>

        <IconButton
          ref={props.rightToggleButtonRef}
          color="inherit"
          onClick={props.onRightButtonClick}
          aria-label={rightAppBarButtonLabel()}
          size="small"
          aria-expanded={props.rightDrawerState !== "floating-closed"}
          disabled={props.rightDrawerState === "pinned"}
        >
          {rightAppBarButtonIcon()}
        </IconButton>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-2 pb-1">
        <div class="inline-flex items-center gap-1 rounded-full border border-base px-2 py-0.5 text-xs text-primary">
          <span class="uppercase text-[10px] tracking-wide text-primary/70">Used</span>
          <span class="font-semibold text-primary">{props.formattedUsedTokens}</span>
        </div>
        <div class="inline-flex items-center gap-1 rounded-full border border-base px-2 py-0.5 text-xs text-primary">
          <span class="uppercase text-[10px] tracking-wide text-primary/70">Avail</span>
          <span class="font-semibold text-primary">{props.formattedAvailableTokens}</span>
        </div>
      </div>
    </div>
  )

  const DesktopLayout = () => (
    <>
      <div class="session-toolbar-left flex items-center gap-3 min-w-0">
        <IconButton
          ref={props.leftToggleButtonRef}
          color="inherit"
          onClick={props.onLeftButtonClick}
          aria-label={leftAppBarButtonLabel()}
          size="small"
          aria-expanded={props.leftDrawerState !== "floating-closed"}
          disabled={props.leftDrawerState === "pinned"}
        >
          {leftAppBarButtonIcon()}
        </IconButton>

        <Show when={props.activeSessionId !== "info"}>
          <div class="inline-flex items-center gap-1 rounded-full border border-base px-2 py-0.5 text-xs text-primary">
            <span class="uppercase text-[10px] tracking-wide text-primary/70">Used</span>
            <span class="font-semibold text-primary">{props.formattedUsedTokens}</span>
          </div>
          <div class="inline-flex items-center gap-1 rounded-full border border-base px-2 py-0.5 text-xs text-primary">
            <span class="uppercase text-[10px] tracking-wide text-primary/70">Avail</span>
            <span class="font-semibold text-primary">{props.formattedAvailableTokens}</span>
          </div>
        </Show>
      </div>

      <div class="session-toolbar-center flex-1 flex items-center justify-center gap-2 min-w-[160px]">
        <button
          type="button"
          class="connection-status-button px-2 py-0.5 text-xs"
          onClick={props.onCommandPaletteClick}
          aria-label="Open command palette"
          style={{ flex: "0 0 auto", width: "auto" }}
        >
          Command Palette
        </button>
        <span class="connection-status-shortcut-hint">
          <Kbd shortcut="cmd+shift+p" />
        </span>
      </div>

      <div class="session-toolbar-right flex items-center gap-3">
        <div class="connection-status-meta flex items-center gap-3">
          <Show when={props.connectionStatus === "connected"}>
            <span class="status-indicator connected">
              <span class="status-dot" />
              <span class="status-text">Connected</span>
            </span>
          </Show>
          <Show when={props.connectionStatus === "connecting"}>
            <span class="status-indicator connecting">
              <span class="status-dot" />
              <span class="status-text">Connecting...</span>
            </span>
          </Show>
          <Show when={props.connectionStatus === "error" || props.connectionStatus === "disconnected"}>
            <span class="status-indicator disconnected">
              <span class="status-dot" />
              <span class="status-text">Disconnected</span>
            </span>
          </Show>
        </div>
        <IconButton
          ref={props.rightToggleButtonRef}
          color="inherit"
          onClick={props.onRightButtonClick}
          aria-label={rightAppBarButtonLabel()}
          size="small"
          aria-expanded={props.rightDrawerState !== "floating-closed"}
          disabled={props.rightDrawerState === "pinned"}
        >
          {rightAppBarButtonIcon()}
        </IconButton>
      </div>
    </>
  )

  return (
    <AppBar position="sticky" color="default" elevation={0} class="border-b border-base">
      <Toolbar variant="dense" class="session-toolbar flex flex-wrap items-center gap-2 py-0 min-h-[40px]">
        <Show when={!props.isPhoneLayout} fallback={<PhoneLayout />}>
          <DesktopLayout />
        </Show>
      </Toolbar>
    </AppBar>
  )
}

export default ShellHeader
